<script lang="ts">
    // Mock data for orders
    const orders = [
        {
            id: 'ORD-001',
            customerName: 'John Doe',
            date: '2024-01-15',
            amount: 299.99,
            status: 'completed',
            paymentMethod: 'credit_card',
            items: [
                { name: 'Course A', quantity: 1, price: 199.99 },
                { name: 'Course B', quantity: 1, price: 100.00 }
            ]
        },
        {
            id: 'ORD-002',
            customerName: 'Jane Smith',
            date: '2024-01-14',
            amount: 149.99,
            status: 'pending',
            paymentMethod: 'paypal',
            items: [
                { name: 'Course C', quantity: 1, price: 149.99 }
            ]
        },
        {
            id: 'ORD-003',
            customerName: 'Mike Johnson',
            date: '2024-01-13',
            amount: 399.99,
            status: 'failed',
            paymentMethod: 'bank_transfer',
            items: [
                { name: 'Course D', quantity: 2, price: 199.99 }
            ]
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
</script>

<div class="container mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">Orders</h2>
    
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                {#each orders as order}
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.id}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customerName}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.date}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${order.amount.toFixed(2)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusColor(order.status)}">
                                {order.status}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button class="text-indigo-600 hover:text-indigo-900">View Details</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>