import { z } from 'zod';

export type FormData = {
    event_id: string;
    rankings?: Array<{
        rank: number;
        department_id: number | null;
        tie_group: number | null;
    }>;
    tie_groups?: string;
}

export const rankingSchema = z.object({
    rank: z.number().int().positive(),
    department_id: z.number().nullable(),
    tie_group: z.number().nullable()
});

export const tieGroupsValidation = z.string()
    .superRefine((value, ctx) => {
        if (!value) return true;

        const formatRegex = /^\d+-\d+(\s*,\s*\d+-\d+)*$/;
        if (!formatRegex.test(value)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Use format like '1-3, 4-6' (ranges separated by comma)"
            });
            return;
        }

        const groups = value.split(",").map(group => group.trim());
        const seenRanks = new Set<number>();
        let lastEndRank = 0;

        for (const group of groups) {
            const [start, end] = group.split("-").map(Number);

            if (start <= 0 || end <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Ranks must be positive numbers"
                });
                return;
            }

            if (start >= end) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Invalid range ${start}-${end}: Start must be less than end`
                });
                return;
            }

            if (start <= lastEndRank) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Groups must be in ascending order with no gaps or overlaps"
                });
                return;
            }

            for (let i = start; i <= end; i++) {
                if (seenRanks.has(i)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Rank ${i} appears in multiple groups`
                    });
                    return;
                }
                seenRanks.add(i);
            }

            lastEndRank = end;
        }
    });
    export const formSchema = z.object({
        event_id: z.string().min(1, "Event must be selected"),
        rankings: z.array(rankingSchema)
            .optional()
            .default([])
            // .refine(
            //     (rankings) => {
            //         if (!rankings || rankings.length === 0) return true;
            //         const validRankings = rankings.filter(r => r && r.department_id !== null && r.department_id !== -1);
            //         const departmentIds = validRankings.map(r => r.department_id);
            //         return new Set(departmentIds).size === validRankings.length;
            //     },
            //     { message: "Each department can only be selected once" }
            // )
            .refine(
                (rankings) => {
                    if (!rankings || rankings.length === 0) return true;
                    const firstValidIndex = rankings.findIndex(r => r && r.department_id !== null && r.department_id !== -1);
                    const lastValidIndex = rankings.findLastIndex(r => r && r.department_id !== null && r.department_id !== -1);
                    for (let i = firstValidIndex; i <= lastValidIndex; i++) {
                        if (!rankings[i] || rankings[i].department_id === null || rankings[i].department_id === -1) {
                            return false;
                        }
                    }
                    return true;
                },
                { message: "No blank departments allowed between the first and last ranking" }
            ),
        tie_groups: tieGroupsValidation.optional().default("")
    }).superRefine((data, ctx) => {
        console.log(data.tie_groups)
        if (!data.tie_groups) return;
            
        const validRanks = data.rankings?.filter(r => r.department_id !== -1) || [];
        const maxRank = validRanks.length;
        
         data.tie_groups.split(',').map(g => {
            const [, end] = g.trim().split('-').map(Number);
            if (end > maxRank) {
                console.log(end)
                console.log(maxRank)
                console.log("ERROR")
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Tie groups cannot exceed maximum rank of ${maxRank}`,
                    path: ['tie_groups'],
                });
                return
            }
            return { end };
        });
    });
     
export type FormSchema = typeof formSchema;

function standardizeTieGroupsFormat(tieGroups: string): string {
    if (!tieGroups?.trim()) return '';
    
    return tieGroups
        .split(',')
        .map(group => {
            const [start, end] = group.trim().split("-").map(Number);
            if (!start || !end || isNaN(start) || isNaN(end)) {
                return '';
            }
            return `${start}-${end}`;
        })
        .filter(Boolean)
        .join(', ');
}

export function assignTieGroups(rankings: NonNullable<FormData['rankings']>, tieGroupsStr: string | undefined): NonNullable<FormData['rankings']> {
    const updatedRankings = rankings.map(r => ({ ...r, tie_group: null as number | null }));
    
    if (!tieGroupsStr?.trim()) {
        return updatedRankings;
    }

    let currentTieGroup = 1;
    const groups = tieGroupsStr.split(',').map(g => g.trim());

    for (let i = 0; i < updatedRankings.length; i++) {
        const currentRank = i + 1;
        const matchingGroup = groups.find(group => {
            const [start, end] = group.split("-").map(Number);
            return currentRank >= start && currentRank <= end;
        });

        if (matchingGroup) {
            const [, groupEnd] = matchingGroup.split("-").map(Number);
            updatedRankings[i].tie_group = currentTieGroup;
            
            if (currentRank === groupEnd) {
                currentTieGroup++;
            }
        }
    }

    return updatedRankings;
}

export function validateAndPrepareTieGroups(formData: Partial<FormData>): FormData {
    if (!formData.event_id) {
        throw new Error("Event ID is required");
    }

    const rankings = formData.rankings || [];
    let tie_groups = formData.tie_groups || "";

    if (!tie_groups.trim()) {
        return {
            event_id: formData.event_id,
            rankings: rankings.map(r => ({ ...r, tie_group: null })),
            tie_groups: ""
        };
    }

    tie_groups = standardizeTieGroupsFormat(tie_groups);

    const validationResult = formSchema.safeParse({
        event_id: formData.event_id,
        rankings,
        tie_groups
    });

    if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
    }

    return {
        event_id: formData.event_id,
        rankings: assignTieGroups(rankings, tie_groups),
        tie_groups
    };
}