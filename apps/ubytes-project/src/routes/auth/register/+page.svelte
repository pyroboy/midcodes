<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  export let form: ActionData;
  export let data: PageData;

  const roles = ['EventChairman', 'TabulationCommittee', 'TabulationHead', 'User','Admin'];
</script>

<h1>Register</h1>

<form method="POST" use:enhance>
  <div>
    <label for="email">Email:</label>
    <input id="email" name="email" type="email" required />
  </div>

  <div>
    <label for="password">Password:</label>
    <input id="password" name="password" type="password" required />
  </div>

  <div>
    <label for="role">Role:</label>
    <select id="role" name="role" required>
      {#each roles as role}
        <option value={role}>{role}</option>
      {/each}
    </select>
  </div>

  <button type="submit">Register</button>
</form>

{#if form?.error}
  <p class="error">{form.error}</p>
{/if}

{#if form?.success}
  <p class="success">{form.message}</p>
{/if}

<h2>Registered Accounts</h2>

<table>
  <thead>
    <tr>
      <!-- <th>Email</th> -->
      <th>Username</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    {#each data.accounts as account}
      <tr>
        <!-- <td>{account.email}</td> -->
        <td>{account.username}</td>
        <td>{account.role}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 300px;
    margin: 2rem auto;
  }

  .error {
    color: red;
  }

  .success {
    color: green;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2rem;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #f5f5f5;
  }
</style>