<!-- src/routes/auth/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { page } from '$app/stores';

  interface Props {
    form: ActionData;
  }

  let { form }: Props = $props();
  let loading = $state(false);

  let error = $derived(form?.error);
  let message = $derived(form?.message);
  let success = $derived(form?.success);
  let email = $derived(form?.email || '');
</script>

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
  <Card class="w-[350px]">
    <CardHeader>
      <CardTitle>Welcome to ID Generator</CardTitle>
      <CardDescription>Sign in to your account or create a new one</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs  class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form method="POST" action="?/signin" use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              loading = false;
              await update();
            };
          }}>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" value={email} required />
              </div>
              <div class="grid gap-2">
                <Label for="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {#if error}
                <div class="text-sm text-red-500">{error}</div>
              {/if}
              <Button type="submit" class="w-full" disabled={loading}>
                {#if loading}
                  Signing in...
                {:else}
                  Sign In
                {/if}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form method="POST" action="?/signup" use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              loading = false;
              await update();
            };
          }}>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" placeholder="name@example.com" value={email} required />
              </div>
              <div class="grid gap-2">
                <Label for="signup-password">Password</Label>
                <Input id="signup-password" name="password" type="password" required />
              </div>
              <div class="grid gap-2">
                <Label for="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" name="confirmPassword" type="password" required />
              </div>
              {#if error}
                <div class="text-sm text-red-500">{error}</div>
              {/if}
              {#if message}
                <div class="text-sm text-green-500">{message}</div>
              {/if}
              <Button type="submit" class="w-full" disabled={loading}>
                {#if loading}
                  Creating account...
                {:else}
                  Create Account
                {/if}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </CardContent>
    <CardFooter class="flex justify-center">
      <a href="/auth/forgot-password" class="text-sm text-muted-foreground hover:underline">
        Forgot your password?
      </a>
    </CardFooter>
  </Card>
</div>
