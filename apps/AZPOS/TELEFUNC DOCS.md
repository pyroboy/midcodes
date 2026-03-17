vite.config.ts example
___

```
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { telefunc } from 'telefunc/vite'

export default defineConfig({
  plugins: [sveltekit(), telefunc()],
  // Avoid page reload which breaks the CI
  optimizeDeps: { include: ['clsx', 'devalue'] },
})
```

telefunc.d.ts example
___
```
import 'telefunc'

declare module 'telefunc' {
  namespace Telefunc {
    interface Context {
      /* Globally define the type of the `context` object here, see https://telefunc.com/getContext#typescript
       * For example:
       user: null | { id: number, name: string }
       */
    }
  }
}
```

# `getContext()`

**Environment**: server.

`getContext()` enables telefunctions to access contextual information.

```
// TodoList.telefunc.ts// Environment: server import { getContext } from 'telefunc' export async function onLoad() {  const context = getContext()  const { user } = context  const todoItems = await Todo.findMany({ select: 'text', authorId: user.id })  return {    todoItems,    userName: user.name  }}
```

It's most commonly used for implementing permissions, see [Guides > Permissions](https://telefunc.com/permissions).

## Provide

Before we can use `getContext()`, we need to provide the `context` object to [Telefunc's Server Middleware](https://telefunc.com/telefunc):

```
// server.js // Server (Express.js/Fastify/...) import { telefunc } from 'telefunc' // Telefunc middlewareapp.all('/_telefunc', async (req, res) => {  // Authentication middlewares (e.g. Passport.js or Grant) usually provide information  // about the logged-in user on the `req` object:  const user = req.user  // Or when using a third-party authentication provider (e.g. Auth0):  const user = await authProviderApi.getUser(req.headers)   const httpResponse = await telefunc({    // We provide the context object here:    context: {      user,    },    url: req.url,    method: req.method,    body: req.body,  })   const { body, statusCode, contentType } = httpResponse  res.status(statusCode).type(contentType).send(body)})
```

## Access

If you get this error:

```
[telefunc][Wrong Usage][getContext()] Cannot access context object, see https://telefunc.com/getContext#access
```

Then this means that `getContext()` was called after an `await` operator:

```
// TodoList.telefunc.js export async function myTelefunction() {  await something()  // ❌ Bad: we should call getContext() before `await something()`  const context = getContext()}
```

Make sure to call `getContext()` before any `await` operators:

```
// TodoList.telefunc.js export async function myTelefunction() {  // ✅ Good: we call getContext() before `await`  const context = getContext()  await something()}
```

## TypeScript

We can use `Telefunc.Context` to globally set the type of `const context = getContext()`:

```
// TelefuncContext.d.ts import 'telefunc'import type { User } from './User.ts' declare module 'telefunc' {  namespace Telefunc {    interface Context {      user: null | User    }  }}
```

```
// User.ts export type User = { id: number }
```

```
// *.telefunc.ts import { getContext } from 'telefunc' export async function someTelefunction() {  // TypeScript knows that `user.id` is a `number`  const { user } = getContext()}
```

We can also directly set `const context = getContext<MyContext>()`:

```
// *.telefunc.ts import { getContext } from 'telefunc' type Context = {  userId: number} export async function someTelefunction() {  // TypeScript knows that `userId` is a `number`  const { userId } = getContext<Context>()}
```


# Permissions

## Basics

Permissions are implemented by using `throw Abort()` and `return`:

```
// TodoItem.telefunc.ts// Environment: server export { onTextChange } import { getContext, Abort } from 'telefunc' function onTextChange(id: string, text: string) {  const { user } = getContext()  if (!user) {    // We return `notLoggedIn: true` so that the frontend can redirect the user to the login page    return { notLoggedIn: true }  }   const todoItem = await Todo.findOne({ id })  if (!todoItem) {    // `throw Abort()` corresponds to "403 Forbidden" of classical APIs    throw Abort()  }   // We can easily programmatically implement advanced permissions such  // as "only allow the author or admins to modify a to-do item".  if (todoItem.authorId !== user.id && !user.isAdmin) {    throw Abort()  }  await todoItem.update({ text })}
```

In general, we use `throw Abort()` upon permission denials but, sometimes, the frontend needs to know why the the telefunction call failed: in this example we return `{ notLoggedIn: true }` instead of `throw Abort()` so that the frontend can perform a redirection:

```
// TodoItem.tsx// Environment: client import { onTextChange } from './TodoItem.telefunc' function onChange(id: string, text: string) {  const res = await onTextChange(id, text)  if (res?.notLoggedIn) {    // Redirect user to login page    window.location.href = '/login'  }} function TodoItem({ id, text }: { id: string; text: string }) {  return <input input="text" value={text} onChange={(ev) => onChange(id, ev.target.value)} />}
```

## `getContext()` wrapping

To implement permission logic once and re-use it, we can define a `getContext()` wrapper:

```
// components/TodoItem.telefunc.ts// Environment: server export { onTextChange } import { getUser } from '../auth/getUser' function onTextChange(id: string, text: string) {  const user = getUser()  /* ... */}
```

```
// auth/getUser.ts// Environment: server // Note that getUser() isn't a telefunction: it's a wrapper around getContext()export { getUser } import { getContext, Abort } from 'telefunc' function getUser() {  const { user } = getContext()  if (!user) {    throw Abort({ notLoggedIn: true })  }  return user}
```

```
// Environment: client import { onAbort } from 'telefunc/client' onAbort(err => {  if (err.abortValue.notLoggedIn) {    // Redirect user to login page    window.location.href = '/login'  }})
```

# Error handling

## Bugs

If a telefunction has a bug:

```
// hello.telefunc.js// Environment: server export { hello } function hello(name) {  // This telefunction has a bug: it should be `name` instead of `namee`  return 'Hello ' + namee}
```

Then a telefunction call throws an error:

```
<!-- index.html --><!-- Environment: client --> <html>  <body>    <script type="module">      import { hello } from './hello.telefunc.js'       try {        await hello('Eva')        console.log("I'm never printed")      } catch(err) {        console.log(err.message) // Prints 'Internal Server Error'        // E.g. show a popup "Something went wrong. Try again (later)."        // ...      }    </script>  </body></html>
```

> To avoid leaking sensitive information, Telefunc doesn't send the original `Error` object to the frontend.

## Expected Errors

An error thrown by a telefunction may not be a bug but an expected error instead.

For example:

- Some authentication libraries throw an error if the user isn't logged in.
- Some validation libraries throw errors upon invalid data.

We can:

1. Propagate the error to the frontend, or
2. handle the error on the server-side.

  

**1. Propagate the error to the frontend.**

We can propagate error information to the frontend like this:

```
import { validate } from 'some-library' function onFromSubmit(data) {  try {    validate(data)  } catch(err) {    return {      errorMessage: `Data is invalid: ${err.message}. Please enter valid data.`    }  }}
```

We can also use `throw Abort(someValue)`:

```
import { validate } from 'some-library'import { Abort } from 'telefunc' function onFromSubmit(data) {  try {    validate(data)  } catch(err) {    throw Abort({      errorMessage: `Data is invalid: ${err.message}. Please enter valid data.`    })  }}
```

In general, we recommend using `return { someValue }` instead of `throw Abort(someValue)`, see explanation at [Guides > Form validation > `throw Abort(someValue)`](https://telefunc.com/form-validation#throw-abort-somevalue).

> We need to catch the error and use `throw Abort(someValue)` because Telefunc doesn't send the original `Error` object to the frontend (in order to avoid leaking sensitive information).

Also see [Guides > Permissions > `getContext()` wrapping](https://telefunc.com/permissions#getcontext-wrapping).

  

**2. Handle the error on the server-side.**

We can handle the thrown error at our Telefunc server middleware:

```
// server.js // Server (Express.js/Fastify/...) import { telefunc } from 'telefunc' // Telefunc middlewareapp.all('/_telefunc', async (req, res) => {  const httpResponse = await telefunc(/* ... */)  // Telefunc exposes any error thrown by a telefunction at httpResponse.err  if (httpResponse.err) {    // Our error handling  }})
```

Also see [API > `getContext()` > Provide](https://telefunc.com/getContext#provide).

## Network Errors

If the user's browser can't connect to our server:

```
<!-- index.html --><!-- Environment: client --> <html>  <body>    <script type="module">      import { hello } from './hello.telefunc.js'       try {        await hello('Eva')      } catch(err) {        if (err.isConnectionError) {          // There is a network problem:          //  - the user isn't connected to the internet, or          //  - our server is down.          console.log(err.message) // Prints 'No Server Connection'        }      }    </script>  </body></html>
```


# Form validation

When a user enters a form with invalid inputs, such as an invalid email address, then we want our UI to tell the user what went wrong.

We can pass information about invalid inputs to the frontend by using `return someValue`:

```
// SignUpForm.telefunc.ts// Environment: server export async function onFormSubmit(email: string, password: string) {  // Form validation  const inputErrors = {}   if (!email) {    inputErrors.email = 'Please enter your email.'  } else if (!email.includes('@')) {    inputErrors.email = 'Invalid email; make sure to enter a valid email.'  }   if (!password) {    inputErrors.password = 'Please enter a password.'  } else if (password.length < 8) {    inputErrors.password = 'Password must have at least 8 characters.'  }   if (Object.keys(inputErrors).length > 0) {    // Instead of `throw Abort()`    return { inputErrors }  }   // Some ORM/SQL query  const user = await User.create({ email, password })   return { user }}
```

## `throw Abort(someValue)`

We can use `throw Abort(someValue)` instead of `return someValue`:

```
// SignUpForm.telefunc.ts// Environment: server import { Abort } from 'telefunc' export async function onFormSubmit(email: string, password: string) {  if (!email) {    throw Abort({      inputErrors: {        email: 'Please enter your email.'      }    })  }  /* ... */}
```

In general, we recommend using `return { someValue }` instead of `throw Abort(someValue)` because:

1. It makes the code's intent clearer: the reader of our code knows that `return someValue` is an expected case that will be handled by the frontend, whereas when throwing an error it isn't obvious whether/where/how the error will be handled by the frontend.
2. `return someValue` has better TypeScript DX, as TypeScript doesn't typecheck caught errors:
    
    ```
    try {  /* ... */} catch(err: unknown) {  // err needs to be casted  const errCasted = (err as ValidationError | SomeOtherError)}
    ```
    
    
    # Event-based telefunctions

> **What is this about?**
> 
> This page explains how to most efficiently use Telefunc (and RPC in general) to significantly increase development speed.
> 
> See [Overview > RPC](https://telefunc.com/RPC) if you aren't familiar with RPC.

With REST and GraphQL, API endpoints are:

- Generic (agnostic to your frontend needs)
- Backend-owned (defined and implemented by the backend team)

With Telefunc, it's usually the opposite — telefunctions are:

- Tailored (specific to your frontend needs)
- Frontend-owned (defined and implemented by the frontend team)

This inversion is at the cornerstone of using Telefunc proficiently.

You may be tempted to create generic telefunctions but we recommend against it. Instead, we recommend implementing what we call _event-based telefunctions_.

```
// database/todo.telefunc.ts // ❌ Generic telefunction: one telefunction re-used for multiple use casesexport async function updateTask(id: number, modifications: Partial<TodoItem>) {  // ...}
```

```
// components/TodoList.telefunc.ts // ✅ Event-based telefunctions: one telefunction per use case export async function onTodoTextUpdate(id: number, text: string) {  // ...}export async function onTodoCompleted(id: number) {  // ...}
```

In the example below, we explain why event-based telefunctions lead to increased:

- Development speed (while we explain how to keep telefunctions DRY)
- Security
- Performance

## Example

Imagine an existing to-do list app, and the product manager requests a new feature: add a new button `Mark all tasks as completed`.

With a RESTful API, the app would typically do this:

```
HTTP            URL                                           PAYLOAD=========       =========================================     =====================# Make a request to fetch all non-completed tasksGET             https://api.todo.com/task?completed=false     ∅# Make a request per task to update itPOST            https://api.todo.com/task/42                  { "completed": true }POST            https://api.todo.com/task/1337                { "completed": true }POST            https://api.todo.com/task/7                   { "completed": true }
```

This is inefficient as it makes a lot of HTTP requests (the infamous `N+1` problem).

With Telefunc, you can do this instead:

```
// components/TodoList.telefunc.ts// Environment: server import { Tasks } from '../database/Tasks' export async function onMarkAllAsCompleted() {  // With an ORM:  await Tasks.update({ completed: true }).where({ completed: false })  /* Or with SQL:  await sql('UPDATE tasks SET completed = true WHERE completed = false')  */}
```

The telefunction `onMarkAllAsCompleted()` is tailored: it's created specifically to serve the needs of the `<TodoList>` component. It's simpler and a lot more efficient.

#### Convention

We recommend naming telefunctions `onSomeEvent()` (see [Naming convention](https://telefunc.com/event-based#naming-convention)), because telefunction calls are always triggered by some kind of event — typically a user action, such as the user clicking on a button.

```
# Also: we recommend co-locating .telefunc.js filescomponents/TodoList.telefunc.ts # telefunctions for <TodoList>components/TodoList.tsx # <TodoList> implementation
```

```
// components/TodoList.tsx// Environment: client import { onMarkAllAsCompleted } from './TodoList.telefunc.ts' function TodoList() {  return <>    {/* ... */}    <button onClick={onMarkAllAsCompleted}>      Mark all as completed    </button>  </>}
```

This naming convention ensures telefunctions are tightly coupled to UI components.

> With Telefunc, you think in terms of what the frontend needs (instead of thinking of the backend as a generic data provider). From that perspective, it makes more sense to co-locate telefunctions next to UI components (instead of next to where data comes from).

#### Too restrictive convention?

To keep telefunctions [DRY](https://softwareengineering.stackexchange.com/questions/400183/what-should-i-consider-when-the-dry-and-kiss-principles-are-incompatible) you may be tempted to define a single telefunction that is re-used by many UI components. For example:

```
// database/actions/tasks.telefunc.ts// Environment: server import { Task } from '../models/Task'import { getContext } from 'telefunc' // One telefunction used by multiple UI componentsexport async function updateTask(id: number, mods: Partial<typeof Task>) {  const { user } = getContext()  const task = await Task.update(mods).where({ id, author: user.id })  // Returns the updated value task.modifiedAt  return task}
```

But this generic telefunction has two issues:

1. It isn't safe.
    
    > As explained at [Overview > RPC](https://telefunc.com/RPC), telefunctions are public. This means any user can call `updateTask({ author: Math.floor(Math.random()*100000) })` which is a big security issue.
    
2. It isn't efficient.
    
    > Because `updateTask()` is generic, it must `return task` in case a component requires `task.modifiedAt` — but if some components don't need it, this results in wasted network bandwidth.
    

This shows how easy it is to introduce security issues and inefficiencies with generic telefunctions.

Generic telefunctions typically:

- Make reasoning about [RPC security](https://telefunc.com/RPC#security) harder, leading to subtle bugs and security issues.
- Decrease [RPC performance](https://telefunc.com/RPC#performance).

We recommend the following instead:

```
// database/actions/task.ts import { getContext } from 'telefunc' // This isn't a telefunction: it's a normal server-side functionexport async function updateTask(id: number, mods: Partial<Task>) {  const { user } = getContext() // Can also be used in normal functions  const task = await Task.update(mods).where({ id, author: user.id })  // Returns the updated value task.modifiedAt  return task}
```

```
// components/TodoList.telefunc.ts import { updateTask } from '../database/actions/task' // Returns task.modifiedAtexport const onTodoTextUpdate = (id: number, text: string) => updateTask(id, { text })// Doesn't return task.modifiedAtexport const onTodoCompleted = (id: number) => { await updateTask(id, { completed: false }) }
```

It's slightly less DRY but, in exchange, you get a much clearer structure around security and performance.

When a telefunction is tightly coupled with a component:

- The telefunction's return value can be minimal (exactly and only what is needed by the component), which leads to increased performance.
- The telefunction's arguments can be minimal (exactly and only what is needed by the component), which leads to increased security.
- The telefunction can allow only what is strictly required by the component.
    
    > A cornerstone of security is to grant only the permissions that are strictly required.
    

That's why we recommend event-based telefunctions, along with the naming convention to ensure telefunctions are tightly coupled to components.

> If there are two UI components that could use the exact same telefunction — wouldn't it be nice to create a single telefunction instead of duplicating the same telefunction?
> 
> - It's a rare situation (UI components usually have slightly different requirements).
> - Consider creating a new shared UI component used by these two components.
> - Using the deduplication approach shown above, only one line of duplicated code remains:



```
>     // TodoItem.telefunc.js// Defined once for <TodoItem>export const onTodoTextUpdate = (id: number, text: string) => updateTask(id, { text })
  ```

```
>     // TodoList.telefunc.js// Defined again for <TodoList> — the code duplication is only one line of codeexport const onTodoTextUpdate = (id: number, text: string) => updateTask(id, { text })
 ```
  

## Naming convention

As explained in [the example above](https://telefunc.com/event-based#example), for a clear structure and proficient Telefunc usage, we recommend the following convention.

Name telefunctions `onSomeEvent()`:

```
    TELEFUNCTIONS    =============❌  updateTodo()✅  onTodoTextUpdate()✅  onTodoComplete() ❌  loadData()✅  onLoad()✅  onPagination()✅  onInfiniteScroll()
```

Co-locate `.telefunc.js` files next to UI component files:

```
    FILES    =====    components/TodoItem.tsx✅  components/TodoItem.telefunc.ts❌  database/todo.telefunc.ts     components/User.vue✅  components/User.telefunc.js❌  database/user/getLoggedInUser.telefunc.js
```

This convention is optional and you can opt-out.

### Opt out

Telefunc shows a warning if you don't follow the naming convention — you can opt-out of the convention and remove the warning by setting [`config.disableNamingConvention`](https://telefunc.com/disableNamingConvention).

> Opting out of the naming convention is perfectly fine, though we recommend having a clear reason for doing so.
> 
> We recommend reading [the example above](https://telefunc.com/event-based#example) before opting out. It explains why event-based telefunctions lead to increased:
> 
> - Development speed
> - Security
> - Performance


# File upload

Using Telefunc to upload files is currently only supported by encoding the file as a string, for example as [Data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs). You can use [`FileReader.readAsDataURL()`](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL) to encode a `File` object to a Data URL. However, be aware that files encoded in this way are at least [33% larger](https://developer.mozilla.org/en-US/docs/Glossary/Base64#encoded_size_increase).

Another possibility is to use an endpoint separate from Telefunc to handle file uploads. For example, you can use [expressjs/multer](https://github.com/expressjs/multer) when using Node.js.



# `shield()`

**Environment**: server.

We use `shield()` to guarantee the type of telefunction arguments. (As explained in [Overview > RPC](https://telefunc.com/RPC), telefunctions are public and need protection.)

```
// CreateTodo.telefunc.js// Environment: server export { onNewTodo } import { shield } from 'telefunc'const t = shield.type shield(onNewTodo, [t.string])async function onNewTodo(text) {  // `text` is guaranteed to be a `string`: if `onNewTodo(42)` is called then Telefunc  // throws an error that `text` should be a `string` (instead of a `number`)}
```

> If we use TypeScript, then Telefunc automatically defines `shield()`, see [TypeScript - Automatic](https://telefunc.com/shield#typescript-automatic).

## TypeScript - Automatic

If we use TypeScript, then Telefunc automatically generates `shield()` for each telefunction.

In other words: telefunction argument types are automatically validated at runtime:

```
// hello.telefunc.ts // We don't need to define a shield() when using TypeScript: Telefunc automatically generates// it for us. For example here, Telefunc automatically aborts the telefunction call if the// argument is `hello({ name: 42 })` and throws an error that `name` should be a `number`.export async function hello({ name }: { name: string }) {   return `Welcome to Telefunc, ${name}.`}
```

With Telefunc, not only can we seamlessly re-use types across our frontend and backend code, but we also get automatic type-safety at runtime. If we use a TypeScript ORM (e.g. [Prisma](https://www.prisma.io/)) or SQL builder (e.g. [Kysely](https://github.com/koskimas/kysely) and [others](https://github.com/stars/brillout/lists/sql)), then we get end-to-end type safety all the way from database to frontend.

> For a faster development, Telefunc doesn't generate `shield()` and your telefunction arguments aren't validated during development. Telefunc only generates `shield()` upon building your app for production. You can enable the generation of `shield()` for development by setting [`config.shield.dev`](https://telefunc.com/shield-config) to `true`.

> Telefunc's automatic `shield()` generation only works for stacks that transpile server-side code (Next.js, Vite, Vike, SvelteKit, Nuxt, etc.).
> 
> For stacks that don't transpile server-side code (e.g. React Native and Parcel), we need to define `shield()` manually ourselves: see [TypeScript - Manual](https://telefunc.com/shield#typescript-manual).

## TypeScript - Manual

If we define `shield()` manually (instead of using Telefunc's automatic `shield()` generator as described in [TypeScript - Automatic](https://telefunc.com/shield#typescript-automatic)), then note that we don't need to define the arguments type twice:

```
import { shield } from 'telefunc' export const onNewTodo = shield(  [shield.type.string],  async function (text) {    // ✅ TypeScript knows that `text` is of type `string`  })
```

Note that the following doesn't work:

```
import { shield } from 'telefunc' shield(onNewTodo, [shield.type.string])// TypeScript cannot infer the type of named functions by design.export async function onNewTodo(text) {  // ❌ TypeScript doesn't know that `text` is of type `string`}
```

## Common types

Examples showcasing the most common `shield()` types:

```
// TodoList.telefunc.js// Environment: server import { shield } from 'telefunc'const t = shield.type shield(onTextChange, [t.number, t.string])async function onTextChange(id, text) {  // typeof id === 'number'  // typeof text === 'string'} shield(onCompletedToggle, [{ id: t.number, isCompleted: t.boolean }])async function onCompletedToggle({ id, isCompleted }) {  // typeof id === 'number'  // typeof isCompleted === 'boolean'} shield(onTagListChange, [t.array(t.string)])async function onTagListChange(tagList) {  // tagList.every(tagName => typeof tagName === 'string')} shield(onNewMilestone, [{  name: t.string,  deadline: t.nullable(t.date),  ownerId: t.optional(t.number)}])async function onNewMilestone({ name, deadline, ownerId }) {  // typeof name === 'string'  // deadline === null || deadline.constructor === Date  // ownerId === undefined || typeof ownerId === 'number'} shield(onStatusChange, [t.or(  t.const('DONE'),  t.const('PROGRESS'),  t.const('POSTPONED'))])async function onStatusChange(status) {  // status === 'DONE' || status === 'PROGRESS' || status === 'POSTPONED'}
```

## All types

List of `shield()` types:

| `const t = shield.type`   | TypeScript                | JavaScript                                |
| ------------------------- | ------------------------- | ----------------------------------------- |
| `t.string`                | `string`                  | `typeof value === 'string'`               |
| `t.number`                | `number`                  | `typeof value === 'number'`               |
| `t.boolean`               | `boolean`                 | `value === true \| value === false`       |
| `t.date`                  | `Date`                    | `value.constructor === Date`              |
| `t.array(T)`              | `T[]`                     | `value.every(element => isT(element))`    |
| `t.object(T)`             | `Record<string, T>`       | `Object.values(value).every(v => isT(v))` |
| `{ k1: T1, k2: T2, ... }` | `{ k1: T1, k2: T2, ... }` | `isT1(value.k1) && isT2(value.k2) && ...` |
| `t.or(T1, T2, ...)`       | `T1 \| T2 \| ...`         | `isT1(value) \| isT2(value) \| ...`       |
| `t.tuple(T1, T2, ...)`    | `[T1, T2, ...]`           | `isT1(value[0]) && isT2(value[1]) && ...` |
| `t.const(val)`            | `val as const`            | `value === val`                           |
| `t.optional(T)`           | `T \| undefined`          | `isT(value) \| value === undefined`       |
| `t.nullable(T)`           | `T \| null`               | `isT(value) \| value === null`            |
| `t.any`                   | `any`                     | `true`                                    |


# `telefunc()`

**Environment**: server.

We install Telefunc by using Telefunc's server middleware `telefunc()`:

```
// server.js // Server (Express.js/Fastify/...) import { telefunc } from 'telefunc' // Telefunc middlewareapp.all('/_telefunc', async (req, res) => {  const httpResponse = await telefunc({    // HTTP Request URL, which is '/_telefunc' if we didn't modify config.telefuncUrl    url: req.url,    // HTTP Request Method (GET, POST, ...)    method: req.method,    // HTTP Request Body, which can be a string, buffer, or stream    body: req.body,    // Optional    context: {      /* Some context */    }  })  const { body, statusCode, contentType } = httpResponse  res.status(statusCode).type(contentType).send(body)})
```


# `onBug()`

**Environment**: server.

To track bugs, we use `onBug()`:

```
import { onBug } from 'telefunc' onBug(err => {  // ...})
```

This allows us, for example, to install the tracker code of some tracking service ([Sentry](https://sentry.io/), [Bugsnag](https://www.bugsnag.com/), [Rollbar](https://rollbar.com/), ...).

`onBug()` is called:

- When a telefunction throws an error that is not `Abort()`. (In other words, our telefunction has a bug.)
- When Telefunc throws an error. (In other words, Telefunc has a bug).
  
  
  
  # `onAbort()`

**Environment**: client.

The `onAbort()` hook is called whenever the browser makes a telefunction call that fails because the telefunction ran [`throw Abort()`](https://telefunc.com/Abort).

```
// Environment: client import { onAbort } from 'telefunc/client' onAbort(err => {  if (err.abortValue.notLoggedIn) {    // Redirect user to login page    window.location.href = '/login'  }})
```


# `telefuncUrl`

**Environment**: server, client.  

By default, Telefunc uses the URL pathname `/_telefunc` to communicate between client and server.

You can use `config.telefuncUrl` to change that URL.

## Basic usage

You always need to set the value twice: on the server- and client-side.

On the server-side:

```
// Environment: server import { config } from 'telefunc' config.telefuncUrl = '/api/_telefunc'
```

> You usually define server-side configs (`import { config } from 'telefunc'`) at your server entry. For example if you use [Express.js](https://expressjs.com/):
> 
> ```
> // /server/index.js// Environment: server import express from 'express'import { config } from 'telefunc' const app = express() // Config values can be set hereconfig.someServerSideSetting = 'some-value'
> ```

On the client-side:

```
// Environment: client import { config } from 'telefunc/client' config.telefuncUrl = '/api/_telefunc'
```

> You can define client-side configs (`import { config } from 'telefunc/client'`) anywhere, just make sure to do it at global client-side code that is always executed. For example [`/pages/+client.js`](https://vike.dev/client) if you use [Vike](https://vike.dev/):
> 
> ```
> // /pages/+client.js// Environment: client import { config } from 'telefunc/client' // Config values can be set hereconfig.someClientSideSetting = 'some-value'
> ```

## Different domain

If you deploy your frontend and backend at different domain names, then do the following.

```
// Environment: client import { config } from 'telefunc/client' // The client-side value can be:// - a URL pathname (such as '/_telefunc')// - a URL with origin (such as 'https://example.org/api/_telefunc')// - an IP address (such as '192.158.1.38')config.telefuncUrl = 'https://example.org/api/_telefunc'
```

```
// Environment: server import { config } from 'telefunc' // The server-side value always needs to be a URL pathname (such as '/_telefunc')config.telefuncUrl = '/api/_telefunc'
```


# `disableNamingConvention`

**Environment**: server.

Opt out of the [naming convention for event-based telefunctions](https://telefunc.com/event-based#naming-convention) (removes all related warnings).

```
// Environment: server import { config } from 'telefunc' config.disableNamingConvention = true
```

> Opting out of the naming convention is perfectly fine, though we recommend having a clear reason for doing so.
> 
> We recommend reading [Guides > Event-based telefunctions](https://telefunc.com/event-based) before opting out. It explains why event-based telefunctions lead to increased:
> 
> - Development speed
> - Security
> - Performance
> 
> [Feel free to reach out](https://github.com/brillout/telefunc/issues/new) if you have questions.

> You usually define server-side configs (`import { config } from 'telefunc'`) at your server entry. For example if you use [Express.js](https://expressjs.com/):
> 
> ```
> // /server/index.js// Environment: server import express from 'express'import { config } from 'telefunc' const app = express() // Config values can be set hereconfig.someServerSideSetting = 'some-value
> ```


# `httpHeaders`

**Environment**: client.

Send additional HTTP headers to be sent along Telefunc HTTP requests.

Usually used for sending authentication headers.

```
// Environment: client import { config } from 'telefunc/client' config.httpHeaders = {  Authorization: `Bearer ${token}`}
```

> You can define client-side configs (`import { config } from 'telefunc/client'`) anywhere, just make sure to do it at global client-side code that is always executed. For example [`/pages/+client.js`](https://vike.dev/client) if you use [Vike](https://vike.dev/):
> 
> ```
> // /pages/+client.js// Environment: client import { config } from 'telefunc/client' // Config values can be set hereconfig.someClientSideSetting = 'some-value'
> ```

# `fetch`

**Environment**: client.

You can specify the fetch function that Telefunc uses for making HTTP requests on the client side.

This is useful for customizing the request and response behavior.

```
// Environment: client import { config } from 'telefunc/client'import { customFetch } from '../path/to/custom-fetch' config.fetch = customFetch
```

> You can define client-side configs (`import { config } from 'telefunc/client'`) anywhere, just make sure to do it at global client-side code that is always executed. For example [`/pages/+client.js`](https://vike.dev/client) if you use [Vike](https://vike.dev/):
> 
> ```
> // /pages/+client.js// Environment: client import { config } from 'telefunc/client' // Config values can be set hereconfig.someClientSideSetting = 'some-value'
> ```


# `telefuncFiles`

**Environment**: server.

> ⚠️ 
> 
> This is a beta feature.

If you don't use Telefunc's transformer on your server-side (see [Telefunc Transformer](https://telefunc.com/transformer)) then you need to provide the list of your `.telefunc.js` files to Telefunc.

You do so by using:

- `config.telefuncFiles`
- [`config.root`](https://telefunc.com/root)

```
// Environment: server import { config } from 'telefunc' // List of telefunc filesconfig.telefuncFiles = [  require.resolve('./hello.telefunc.mjs')] // The root directory of the projectconfig.root = __dirname
```

See also [`config.root`](https://telefunc.com/root).

> You usually define server-side configs (`import { config } from 'telefunc'`) at your server entry. For example if you use [Express.js](https://expressjs.com/):
> 
> ```
> // /server/index.js// Environment: server import express from 'express'import { config } from 'telefunc' const app = express() // Config values can be set hereconfig.someServerSideSetting = 'some-value'
> ```
> 


# `root`

**Environment**: server.

> ⚠️ 
> 
> This is a beta feature.

If you use [`config.telefuncFiles`](https://telefunc.com/telefuncFiles), then you also need to set `config.root`.

```
// Environment: server import { config } from 'telefunc' // Your project's root directoryconfig.root = __dirname
```

The `config.root` setting is only needed if you use [`config.telefuncFiles`](https://telefunc.com/telefuncFiles).

> You usually define server-side configs (`import { config } from 'telefunc'`) at your server entry. For example if you use [Express.js](https://expressjs.com/):
> 
> ```
> // /server/index.js// Environment: server import express from 'express'import { config } from 'telefunc' const app = express() // Config values can be set hereconfig.someServerSideSetting = 'some-value'
> ```

## Monorepo

If you have a monorepo structure, then set `config.root` to the root directory of your client-side (i.e. the root of Vite/Vike/Next.js/Nuxt/...). Don't set `config.root` to the monorepo root, nor to the root directory of your server. (The `config.root` setting enables Telefunc to match your `.telefunc.js` files/imports between the server-side and the client-side.)

# `shield`

**Environment**: server.  
**Type**: `boolean | { dev?: boolean; prod?: boolean }`.  
**Default**: `{ dev: false, prod: true }`.

Whether to generate [`shield()`](https://telefunc.com/shield) in development and/or when building for production.

```
// Environment: server import { config } from 'telefunc' // Enable shield() generation during developmentconfig.shield.dev = true
```

> ⚠️ 
> 
> Enabling `shield()` generation during development can significantly slow down development speed. Depending on how large your app and how fast your computer is, the decreased development speed can range from unnoticeable to significant.

> You usually define server-side configs (`import { config } from 'telefunc'`) at your server entry. For example if you use [Express.js](https://expressjs.com/):
> 
> ```
> // /server/index.js// Environment: server import express from 'express'import { config } from 'telefunc' const app = express() // Config values can be set hereconfig.someServerSideSetting = 'some-value'
> ```


# `log`

**Environment**: server.  
**Default**: `{ shieldErrors: { dev: true, prod: false } }`.

Whether to log shield errors.

```
// Environment: server import { config } from 'telefunc' config.log.shieldErrors = true// Orconfig.log.shieldErrors = { dev: true, prod: true }
```

> You usually define server-side configs (`import { config } from 'telefunc'`) at your server entry. For example if you use [Express.js](https://expressjs.com/):
> 
> ```
> // /server/index.js// Environment: server import express from 'express'import { config } from 'telefunc' const app = express() // Config values can be set hereconfig.someServerSideSetting = 'some-value'
> ```
> 


# Vite Plugin

Telefunc's [Vite](https://vitejs.dev/) plugin automatically adds Telefunc to Vite apps.

The plugin:

- Transforms our `.telefunc.js` files, see [Telefunc Transformer](https://telefunc.com/transformer).
- Automatically adds the [Telefunc Server Middleware](https://telefunc.com/telefunc) to Vite's development server as well as Vite's preview server.
- Lazy-loads our `.telefunc.js` files for optimal development speed (aka on-demand compilation).

We can pass Telefunc server configurations to the Vite plugin:

```
// vite.config.js import { telefunc } from 'telefunc/vite' export default {  plugins: [    telefunc({      disableNamingConvention: true,      // ...    })  ]}
```