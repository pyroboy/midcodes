import { c as create_ssr_component, v as validate_component, s as subscribe, q as onDestroy, e as escape, u as null_to_empty } from "../../../../../chunks/ssr.js";
import { s as superForm } from "../../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../../chunks/formData.js";
import "../../../../../chunks/index2.js";
import { C as Card } from "../../../../../chunks/card.js";
import { C as Card_content } from "../../../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../../chunks/card-title.js";
import { I as Input } from "../../../../../chunks/input.js";
import { L as Label } from "../../../../../chunks/label.js";
import { p as page } from "../../../../../chunks/stores.js";
import { C as Credit_card } from "../../../../../chunks/credit-card.js";
import { B as Button } from "../../../../../chunks/button.js";
const PaymentInstructions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { amount } = $$props;
  let { referenceCode } = $$props;
  if ($$props.amount === void 0 && $$bindings.amount && amount !== void 0) $$bindings.amount(amount);
  if ($$props.referenceCode === void 0 && $$bindings.referenceCode && referenceCode !== void 0) $$bindings.referenceCode(referenceCode);
  return `<div class="bg-yellow-50 rounded-lg p-4 space-y-3 h-full overflow-y-auto"><div class="flex items-center gap-2 text-yellow-800 font-semibold animate-in fade-in slide-in-from-right duration-500">${validate_component(Credit_card, "CreditCard").$$render($$result, { size: 20 }, {}, {})} <h3 data-svelte-h="svelte-1vy85w7">Payment Instructions</h3></div> ${``}</div>`;
});
const css = {
  code: ".overflow-y-auto.svelte-ogu61z::-webkit-scrollbar{display:none}.overflow-y-auto.svelte-ogu61z{-ms-overflow-style:none;scrollbar-width:none}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { superForm } from \\"sveltekit-superforms/client\\";\\nimport { Button } from \\"$lib/components/ui/button\\";\\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from \\"$lib/components/ui/card\\";\\nimport { Input } from \\"$lib/components/ui/input\\";\\nimport { Label } from \\"$lib/components/ui/label\\";\\nimport { onMount, onDestroy } from \\"svelte\\";\\nimport { page } from \\"$app/stores\\";\\nimport PaymentInstructions from \\"../register/PaymentInstructions.svelte\\";\\nimport { Check, Clock, AlertTriangle } from \\"lucide-svelte\\";\\nexport let data;\\nconst { form, enhance, message } = superForm(data.form);\\nlet qrContainer;\\nconst formatDate = (date) => {\\n  return new Date(date).toLocaleDateString(\\"en-PH\\", {\\n    year: \\"numeric\\",\\n    month: \\"short\\",\\n    day: \\"numeric\\",\\n    hour: \\"2-digit\\",\\n    minute: \\"2-digit\\"\\n  });\\n};\\nconst formatCurrency = (amount2) => {\\n  return new Intl.NumberFormat(\\"en-PH\\", {\\n    style: \\"currency\\",\\n    currency: \\"PHP\\"\\n  }).format(amount2);\\n};\\nfunction getTimeLeft(createdAt, timeoutMinutes) {\\n  const createdTime = new Date(createdAt).getTime();\\n  const timeoutTime = createdTime + timeoutMinutes * 60 * 1e3;\\n  const now = (/* @__PURE__ */ new Date()).getTime();\\n  return Math.max(0, timeoutTime - now);\\n}\\nfunction formatTimeLeft(ms) {\\n  if (ms <= 0) return \\"Expired\\";\\n  const days = Math.floor(ms / (1e3 * 60 * 60 * 24));\\n  const hours = Math.floor(ms % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60));\\n  const minutes = Math.floor(ms % (1e3 * 60 * 60) / (1e3 * 60));\\n  const seconds = Math.floor(ms % (1e3 * 60) / 1e3);\\n  let timeString = \\"\\";\\n  if (days > 0) timeString += \`\${days}d \`;\\n  if (hours > 0) timeString += \`\${hours}h \`;\\n  if (minutes > 0) timeString += \`\${minutes}m \`;\\n  timeString += \`\${seconds}s\`;\\n  return timeString.trim();\\n}\\nlet timeLeft = \\"\\";\\nlet countdownInterval;\\nonMount(() => {\\n  if (!data.attendee.is_paid) {\\n    countdownInterval = window.setInterval(() => {\\n      timeLeft = formatTimeLeft(\\n        getTimeLeft(\\n          data.attendee.created_at,\\n          data.event.payment_timeout_minutes || 60\\n        )\\n      );\\n    }, 1e3);\\n  }\\n});\\nonDestroy(() => {\\n  if (countdownInterval) clearInterval(countdownInterval);\\n});\\n$: amount = data.attendee.ticket_info.price?.toString() || \\"0\\";\\n<\/script>\\n\\n<svelte:head>\\n    <title>Attendee Details - {data.event.event_name}</title>\\n</svelte:head>\\n\\n<div class=\\"container mx-auto px-4 py-8\\">\\n    <div class=\\"max-w-5xl mx-auto\\">\\n        <!-- Main Content Grid -->\\n        <div class=\\"grid lg:grid-cols-2 gap-6\\">\\n            <!-- Left Column - QR and Details -->\\n            <div class=\\"space-y-6\\">\\n                <Card>\\n                    <CardHeader>\\n                        <div class=\\"flex items-center gap-3 mb-2\\">\\n                            <CardTitle class=\\"text-xl sm:text-2xl\\">{data.event.event_name}</CardTitle>\\n                        </div>\\n                    </CardHeader>\\n                    <CardContent class=\\"space-y-4\\">\\n                        <!-- QR Code -->\\n                        {#if data.attendee.is_paid}\\n                            <div class=\\"flex flex-col items-center space-y-4\\">\\n                                <div class=\\"flex justify-center\\">\\n                                    <img \\n                                        src=\\"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={data.attendee.reference_code_url}\\"\\n                                        alt=\\"Registration QR Code\\"\\n                                        class=\\"w-48 h-48 lg:w-64 lg:h-64 border border-gray-200 rounded-lg\\"\\n                                    />\\n                                </div>\\n                                <!-- Debug info - will remove after fixing -->\\n                         \\n                                <!-- Reference Number -->\\n                                <div class=\\"text-center py-3 bg-blue-50 rounded-lg w-full\\">\\n                                    <p class=\\"text-xs sm:text-sm text-blue-600 font-medium mb-1\\">Reference Number</p>\\n                                    <p class=\\"font-mono text-2xl sm:text-3xl font-bold text-blue-700 tracking-wider break-all px-4\\">{data.attendee.reference_code_url}</p>\\n                                </div>\\n\\n                                <p class=\\"text-xs sm:text-sm text-gray-600 text-center\\">\\n                                    Use this QR code for event check-in\\n                                </p>\\n\\n                                <!-- Timer/Link section -->\\n                                <div class=\\"text-center\\">\\n                                    <a\\n                                        href=\\"/{$page.params.event_url}/{data.attendee.reference_code_url}\\"\\n                                        class=\\"inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm\\"\\n                                    >\\n                                        View your ticket\\n                                    </a>\\n                                </div>\\n                            </div>\\n                        {:else}\\n                            <!-- Reference Number for unpaid tickets -->\\n                            <div class=\\"text-center py-3 bg-blue-50 rounded-lg\\">\\n                                <p class=\\"text-xs sm:text-sm text-blue-600 font-medium mb-1\\">Reference Number</p>\\n                                <p class=\\"font-mono text-2xl sm:text-3xl font-bold text-blue-700 tracking-wider break-all px-4\\">{data.attendee.reference_code_url}</p>\\n                                \\n                                <!-- Payment Countdown -->\\n                                {#if timeLeft !== ''}\\n                                    <div class=\\"mt-3 flex flex-col items-center gap-2\\">\\n                                        <div class=\\"flex items-center gap-2\\">\\n                                            {#if timeLeft === 'Expired'}\\n                                                <AlertTriangle class=\\"w-4 h-4 text-red-500\\" />\\n                                                <span class=\\"text-sm text-red-600 font-medium\\">Registration Expired</span>\\n                                            {:else}\\n                                                <Clock class=\\"w-4 h-4 text-yellow-500\\" />\\n                                                <span class=\\"text-sm text-yellow-600 font-medium\\">Time remaining to pay:</span>\\n                                            {/if}\\n                                        </div>\\n                                        <div class={\`text-xl sm:text-2xl font-mono font-bold \${timeLeft === 'Expired' ? 'text-red-600' : 'text-yellow-600'}\`}>\\n                                            {timeLeft || '...'}\\n                                        </div>\\n                                        {#if timeLeft === 'Expired'}\\n                                            <p class=\\"text-xs sm:text-sm text-red-600 mt-2\\">\\n                                                Your registration has expired. Please register again to get a new slot.\\n                                            </p>\\n                                        {:else}\\n                                            <a \\n                                                href=\\"#payment-instructions\\" \\n                                                class=\\"text-xs sm:text-sm text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1\\"\\n                                            >\\n                                                View payment instructions\\n                                                <svg xmlns=\\"http://www.w3.org/2000/svg\\" class=\\"h-4 w-4\\" viewBox=\\"0 0 20 20\\" fill=\\"currentColor\\">\\n                                                    <path fill-rule=\\"evenodd\\" d=\\"M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\\" clip-rule=\\"evenodd\\" />\\n                                                </svg>\\n                                            </a>\\n                                        {/if}\\n                                    </div>\\n                                {/if}\\n                            </div>\\n                        {/if}\\n\\n                        <!-- Attendee Info -->\\n                        <div>\\n                            <h3 class=\\"text-base sm:text-lg font-semibold mb-2\\">Attendee Information</h3>\\n                            <div class=\\"grid grid-cols-2 gap-4\\">\\n                                <div>\\n                                    <Label class=\\"text-xs sm:text-sm text-gray-600\\">Name</Label>\\n                                    <p class=\\"text-sm sm:text-base font-medium\\">\\n                                        {data.attendee.basic_info.firstName} {data.attendee.basic_info.lastName}\\n                                    </p>\\n                                </div>\\n                                <div>\\n                                    <Label class=\\"text-xs sm:text-sm text-gray-600\\">Email</Label>\\n                                    <p class=\\"text-sm sm:text-base break-all\\">{data.attendee.basic_info.email}</p>\\n                                </div>\\n                                <div>\\n                                    <Label class=\\"text-xs sm:text-sm text-gray-600\\">Phone</Label>\\n                                    <p class=\\"text-sm sm:text-base\\">{data.attendee.basic_info.phone}</p>\\n                                </div>\\n                                <div>\\n                                    <Label class=\\"text-xs sm:text-sm text-gray-600\\">Ticket Type</Label>\\n                                    <p class=\\"text-sm sm:text-base\\">{data.attendee.ticket_info.type}</p>\\n                                </div>\\n                            </div>\\n                        </div>\\n\\n                        <!-- Payment Status -->\\n                        <div>\\n                            <h3 class=\\"text-base sm:text-lg font-semibold mb-2\\">Payment Status</h3>\\n                            <div class=\\"flex items-center gap-2\\">\\n                                <div class={\`w-2.5 h-2.5 rounded-full \${data.attendee.is_paid ? 'bg-green-500' : timeLeft === 'Expired' ? 'bg-red-500' : 'bg-yellow-500'}\`}></div>\\n                                <span class={\`text-sm sm:text-base font-medium \${data.attendee.is_paid ? 'text-green-600' : timeLeft === 'Expired' ? 'text-red-600' : 'text-yellow-600'}\`}>\\n                                    {data.attendee.is_paid ? 'Paid' : timeLeft === 'Expired' ? 'Expired' : 'Payment Pending'}\\n                                </span>\\n                            </div>\\n                            {#if data.attendee.is_paid}\\n                                <p class=\\"text-xs sm:text-sm text-gray-600 mt-1\\">\\n                                    Amount Paid: {formatCurrency(data.attendee.ticket_info.price || 0)}\\n                                </p>\\n                                <p class=\\"text-xs sm:text-sm text-gray-600\\">\\n                                    Date: {formatDate(data.attendee.updated_at)}\\n                                </p>\\n                            {/if}\\n                        </div>\\n\\n                        <!-- Email Receipt Form -->\\n                        {#if data.attendee.is_paid}\\n                            <div>\\n                                <h3 class=\\"text-base sm:text-lg font-semibold mb-2\\">Email Receipt</h3>\\n                                <form method=\\"POST\\" action=\\"?/sendReceipt\\" use:enhance>\\n                                    <div class=\\"flex gap-2\\">\\n                                        <div class=\\"flex-1\\">\\n                                            <Input\\n                                                type=\\"email\\"\\n                                                name=\\"email\\"\\n                                                placeholder=\\"Enter email address\\"\\n                                                bind:value={$form.email}\\n                                                class=\\"text-sm\\"\\n                                            />\\n                                        </div>\\n                                        <Button type=\\"submit\\" class=\\"text-sm whitespace-nowrap\\">Send Receipt</Button>\\n                                    </div>\\n                                    {#if $message}\\n                                        <p class=\\"text-xs sm:text-sm mt-1\\" class:text-green-600={$message.success} class:text-red-600={!$message.success}>\\n                                            {$message.text}\\n                                        </p>\\n                                    {/if}\\n                                </form>\\n                            </div>\\n                        {/if}\\n                    </CardContent>\\n                </Card>\\n            </div>\\n\\n            <!-- Right Column - Payment Instructions -->\\n            {#if !data.attendee.is_paid}\\n                <div id=\\"payment-instructions\\" class=\\"h-full scroll-mt-4\\">\\n                    <PaymentInstructions amount={amount} referenceCode={data.attendee.reference_code_url} />\\n                </div>\\n            {/if}\\n        </div>\\n    </div>\\n</div>\\n\\n<style>\\n    /* Hide scrollbar for Chrome, Safari and Opera */\\n    .overflow-y-auto::-webkit-scrollbar {\\n        display: none;\\n    }\\n\\n    /* Hide scrollbar for IE, Edge and Firefox */\\n    .overflow-y-auto {\\n        -ms-overflow-style: none;  /* IE and Edge */\\n        scrollbar-width: none;  /* Firefox */\\n    }\\n</style>\\n"],"names":[],"mappings":"AAiPI,8BAAgB,mBAAoB,CAChC,OAAO,CAAE,IACb,CAGA,8BAAiB,CACb,kBAAkB,CAAE,IAAI,CACxB,eAAe,CAAE,IACrB"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let amount;
  let $page, $$unsubscribe_page;
  let $form, $$unsubscribe_form;
  let $message, $$unsubscribe_message;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { data } = $$props;
  const { form, enhance, message } = superForm(data.form);
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  $$unsubscribe_message = subscribe(message, (value) => $message = value);
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const formatCurrency = (amount2) => {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount2);
  };
  onDestroy(() => {
  });
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    amount = data.attendee.ticket_info.price?.toString() || "0";
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-l561lc_START -->${$$result.title = `<title>Attendee Details - ${escape(data.event.event_name)}</title>`, ""}<!-- HEAD_svelte-l561lc_END -->`, ""} <div class="container mx-auto px-4 py-8"><div class="max-w-5xl mx-auto"> <div class="grid lg:grid-cols-2 gap-6"> <div class="space-y-6">${validate_component(Card, "Card").$$render($$result, {}, {}, {
      default: () => {
        return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
          default: () => {
            return `<div class="flex items-center gap-3 mb-2">${validate_component(Card_title, "CardTitle").$$render($$result, { class: "text-xl sm:text-2xl" }, {}, {
              default: () => {
                return `${escape(data.event.event_name)}`;
              }
            })}</div>`;
          }
        })} ${validate_component(Card_content, "CardContent").$$render($$result, { class: "space-y-4" }, {}, {
          default: () => {
            return ` ${data.attendee.is_paid ? `<div class="flex flex-col items-center space-y-4"><div class="flex justify-center"><img src="${"https://api.qrserver.com/v1/create-qr-code/?size=300x300&amp;data=" + escape(data.attendee.reference_code_url, true)}" alt="Registration QR Code" class="w-48 h-48 lg:w-64 lg:h-64 border border-gray-200 rounded-lg"></div>   <div class="text-center py-3 bg-blue-50 rounded-lg w-full"><p class="text-xs sm:text-sm text-blue-600 font-medium mb-1" data-svelte-h="svelte-162b5bj">Reference Number</p> <p class="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tracking-wider break-all px-4">${escape(data.attendee.reference_code_url)}</p></div> <p class="text-xs sm:text-sm text-gray-600 text-center" data-svelte-h="svelte-u2vhh3">Use this QR code for event check-in</p>  <div class="text-center"><a href="${"/" + escape($page.params.event_url, true) + "/" + escape(data.attendee.reference_code_url, true)}" class="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">View your ticket</a></div></div>` : ` <div class="text-center py-3 bg-blue-50 rounded-lg"><p class="text-xs sm:text-sm text-blue-600 font-medium mb-1" data-svelte-h="svelte-162b5bj">Reference Number</p> <p class="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tracking-wider break-all px-4">${escape(data.attendee.reference_code_url)}</p>  ${``}</div>`}  <div><h3 class="text-base sm:text-lg font-semibold mb-2" data-svelte-h="svelte-60x6hg">Attendee Information</h3> <div class="grid grid-cols-2 gap-4"><div>${validate_component(Label, "Label").$$render(
              $$result,
              {
                class: "text-xs sm:text-sm text-gray-600"
              },
              {},
              {
                default: () => {
                  return `Name`;
                }
              }
            )} <p class="text-sm sm:text-base font-medium">${escape(data.attendee.basic_info.firstName)} ${escape(data.attendee.basic_info.lastName)}</p></div> <div>${validate_component(Label, "Label").$$render(
              $$result,
              {
                class: "text-xs sm:text-sm text-gray-600"
              },
              {},
              {
                default: () => {
                  return `Email`;
                }
              }
            )} <p class="text-sm sm:text-base break-all">${escape(data.attendee.basic_info.email)}</p></div> <div>${validate_component(Label, "Label").$$render(
              $$result,
              {
                class: "text-xs sm:text-sm text-gray-600"
              },
              {},
              {
                default: () => {
                  return `Phone`;
                }
              }
            )} <p class="text-sm sm:text-base">${escape(data.attendee.basic_info.phone)}</p></div> <div>${validate_component(Label, "Label").$$render(
              $$result,
              {
                class: "text-xs sm:text-sm text-gray-600"
              },
              {},
              {
                default: () => {
                  return `Ticket Type`;
                }
              }
            )} <p class="text-sm sm:text-base">${escape(data.attendee.ticket_info.type)}</p></div></div></div>  <div><h3 class="text-base sm:text-lg font-semibold mb-2" data-svelte-h="svelte-1y1grkg">Payment Status</h3> <div class="flex items-center gap-2"><div class="${escape(
              null_to_empty(`w-2.5 h-2.5 rounded-full ${data.attendee.is_paid ? "bg-green-500" : "bg-yellow-500"}`),
              true
            ) + " svelte-ogu61z"}"></div> <span class="${escape(
              null_to_empty(`text-sm sm:text-base font-medium ${data.attendee.is_paid ? "text-green-600" : "text-yellow-600"}`),
              true
            ) + " svelte-ogu61z"}">${escape(data.attendee.is_paid ? "Paid" : "Payment Pending")}</span></div> ${data.attendee.is_paid ? `<p class="text-xs sm:text-sm text-gray-600 mt-1">Amount Paid: ${escape(formatCurrency(data.attendee.ticket_info.price || 0))}</p> <p class="text-xs sm:text-sm text-gray-600">Date: ${escape(formatDate(data.attendee.updated_at))}</p>` : ``}</div>  ${data.attendee.is_paid ? `<div><h3 class="text-base sm:text-lg font-semibold mb-2" data-svelte-h="svelte-1mqvefa">Email Receipt</h3> <form method="POST" action="?/sendReceipt"><div class="flex gap-2"><div class="flex-1">${validate_component(Input, "Input").$$render(
              $$result,
              {
                type: "email",
                name: "email",
                placeholder: "Enter email address",
                class: "text-sm",
                value: $form.email
              },
              {
                value: ($$value) => {
                  $form.email = $$value;
                  $$settled = false;
                }
              },
              {}
            )}</div> ${validate_component(Button, "Button").$$render(
              $$result,
              {
                type: "submit",
                class: "text-sm whitespace-nowrap"
              },
              {},
              {
                default: () => {
                  return `Send Receipt`;
                }
              }
            )}</div> ${$message ? `<p class="${[
              "text-xs sm:text-sm mt-1",
              ($message.success ? "text-green-600" : "") + " " + (!$message.success ? "text-red-600" : "")
            ].join(" ").trim()}">${escape($message.text)}</p>` : ``}</form></div>` : ``}`;
          }
        })}`;
      }
    })}</div>  ${!data.attendee.is_paid ? `<div id="payment-instructions" class="h-full scroll-mt-4">${validate_component(PaymentInstructions, "PaymentInstructions").$$render(
      $$result,
      {
        amount,
        referenceCode: data.attendee.reference_code_url
      },
      {},
      {}
    )}</div>` : ``}</div></div> </div>`;
  } while (!$$settled);
  $$unsubscribe_page();
  $$unsubscribe_form();
  $$unsubscribe_message();
  return $$rendered;
});
export {
  Page as default
};
