import CheckCircle from 'lucide-svelte/icons/check-circle';
import Clock from 'lucide-svelte/icons/clock';
import MinusCircle from 'lucide-svelte/icons/minus-circle';
import Ban from 'lucide-svelte/icons/ban';
import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
import CircleDot from 'lucide-svelte/icons/circle-dot';
import XCircle from 'lucide-svelte/icons/x-circle';
import AlertOctagon from 'lucide-svelte/icons/alert-octagon';
import type { ComponentType } from 'svelte';

const STATUS_ICON_MAP: Record<string, ComponentType> = {
	ACTIVE: CheckCircle,
	PAID: CheckCircle,
	APPROVED: CheckCircle,
	COMPLETED: CheckCircle,
	OCCUPIED: CheckCircle,
	PENDING: Clock,
	ONGOING: Clock,
	RESERVED: Clock,
	INACTIVE: MinusCircle,
	VACANT: MinusCircle,
	BLACKLISTED: Ban,
	OVERDUE: AlertTriangle,
	PENALIZED: AlertTriangle,
	'OVERDUE-PARTIAL': AlertTriangle,
	EXPIRED: AlertTriangle,
	PARTIAL: CircleDot,
	TERMINATED: XCircle,
	REJECTED: XCircle,
	MAINTENANCE: AlertOctagon,
	PLANNED: Clock
};

export function getStatusIcon(status: string): ComponentType {
	return STATUS_ICON_MAP[status?.toUpperCase()] ?? MinusCircle;
}
