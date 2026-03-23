import { db } from '$lib/server/db';
import { people, students, employees, contacts, grades } from '$lib/server/schema';
import { desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [allGrades, allPeople] = await Promise.all([
		db.query.grades.findMany({ orderBy: [desc(grades.createdAt)] }),
		db.query.people.findMany({
			orderBy: [desc(people.createdAt)],
			limit: 100,
			with: { student: { with: { grade: true } }, employee: true }
		})
	]);

	return { grades: allGrades, people: allPeople };
};

export const actions: Actions = {
	addStudent: async ({ request }) => {
		const formData = await request.formData();
		const idNumber = formData.get('idNumber') as string;
		const fullName = formData.get('fullName') as string;
		const gradeId = formData.get('gradeId') as string;
		const motherName = formData.get('motherName') as string;
		const motherPhone = formData.get('motherPhone') as string;
		const fatherName = formData.get('fatherName') as string;
		const fatherPhone = formData.get('fatherPhone') as string;
		const guardianName = formData.get('guardianName') as string;
		const guardianPhone = formData.get('guardianPhone') as string;

		if (!idNumber || !fullName || !gradeId) {
			return fail(400, { error: 'ID Number, Full Name, and Grade are required' });
		}

		const [person] = await db.insert(people).values({
			idNumber, fullName, type: 'student'
		}).returning();

		await db.insert(students).values({ personId: person.id, gradeId });

		// Insert contacts
		const contactEntries: { personId: string; relation: 'mother' | 'father' | 'guardian'; fullName: string; phoneNumber: string }[] = [];
		if (motherName && motherPhone) contactEntries.push({ personId: person.id, relation: 'mother', fullName: motherName, phoneNumber: motherPhone });
		if (fatherName && fatherPhone) contactEntries.push({ personId: person.id, relation: 'father', fullName: fatherName, phoneNumber: fatherPhone });
		if (guardianName && guardianPhone) contactEntries.push({ personId: person.id, relation: 'guardian', fullName: guardianName, phoneNumber: guardianPhone });
		if (contactEntries.length > 0) await db.insert(contacts).values(contactEntries);

		return { success: true };
	},

	addEmployee: async ({ request }) => {
		const formData = await request.formData();
		const idNumber = formData.get('idNumber') as string;
		const fullName = formData.get('fullName') as string;
		const position = formData.get('position') as string;

		if (!idNumber || !fullName || !position) {
			return fail(400, { error: 'All fields are required' });
		}

		const [person] = await db.insert(people).values({
			idNumber, fullName, type: 'employee'
		}).returning();

		await db.insert(employees).values({ personId: person.id, position });

		return { success: true };
	},

	addGrade: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name) return fail(400, { error: 'Grade name is required' });

		await db.insert(grades).values({ name });

		return { success: true };
	}
};
