import { c as create_ssr_component, q as onDestroy, e as escape, v as validate_component, a as add_attribute, b as each } from "../../../../../chunks/ssr.js";
import "../../../../../chunks/supabaseClient.js";
import { s as superForm } from "../../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../../chunks/formData.js";
import "../../../../../chunks/index2.js";
import { C as Card } from "../../../../../chunks/card.js";
import { c as cn } from "../../../../../chunks/utils.js";
import "dequal";
import "../../../../../chunks/create.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../../chunks/table-row.js";
import { t as toast } from "../../../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
import { B as Button } from "../../../../../chunks/button.js";
const css = {
  code: "#qr-reader{width:100% !important;border:none !important;box-shadow:none !important}#qr-reader__status{display:none !important}#qr-reader__dashboard_section_csr button{padding:0.5rem 1rem !important;border-radius:0.375rem !important;background-color:#f3f4f6 !important;color:#374151 !important;font-size:0.875rem !important;line-height:1.25rem !important;font-weight:500 !important;border:1px solid #e5e7eb !important}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { supabase } from \\"$lib/supabaseClient\\";\\nimport { superForm } from \\"sveltekit-superforms/client\\";\\nimport { onMount, onDestroy } from \\"svelte\\";\\nimport { Button } from \\"$lib/components/ui/button\\";\\nimport { Card } from \\"$lib/components/ui/card\\";\\nimport { Label } from \\"$lib/components/ui/label\\";\\nimport {\\n  Table,\\n  TableBody,\\n  TableCell,\\n  TableHead,\\n  TableHeader,\\n  TableRow\\n} from \\"$lib/components/ui/table\\";\\nimport { cn } from \\"$lib/utils\\";\\nimport toast from \\"svelte-french-toast\\";\\nimport { z } from \\"zod\\";\\nexport let data;\\nconst { form, enhance, message } = superForm(data.form, {\\n  onResult: ({ result }) => {\\n    if (result.type === \\"success\\") {\\n      const resultData = result.data;\\n      toast.success(resultData?.message || \\"Scan recorded successfully\\");\\n      lastScannedUrl = null;\\n    } else if (result.type === \\"error\\") {\\n      toast.error(\\"Failed to record scan\\");\\n    }\\n  }\\n});\\nlet scannerElement;\\nlet scanner = null;\\nlet scannerActive = false;\\nlet lastScannedUrl = null;\\nlet scanType = \\"entry\\";\\nlet processing = false;\\nlet scanLogs = data.scanLogs.map((log) => ({\\n  ...log,\\n  attendance_status: log.attendance_status || \\"registered\\"\\n}));\\nfunction getAttendeeDisplayName(basicInfo) {\\n  return \`\${basicInfo.firstName} \${basicInfo.lastName}\`;\\n}\\nconst formatDate = (date) => {\\n  return new Date(date).toLocaleDateString(\\"en-PH\\", {\\n    year: \\"numeric\\",\\n    month: \\"short\\",\\n    day: \\"numeric\\",\\n    hour: \\"2-digit\\",\\n    minute: \\"2-digit\\"\\n  });\\n};\\nasync function initializeScanner() {\\n  try {\\n    const { Html5QrcodeScanner } = await import(\\"html5-qrcode\\");\\n    scanner = new Html5QrcodeScanner(\\n      \\"qr-reader\\",\\n      {\\n        fps: 10,\\n        qrbox: { width: 250, height: 250 },\\n        aspectRatio: 1,\\n        rememberLastUsedCamera: true\\n      },\\n      false\\n    );\\n    scanner.render(onScanSuccess, onScanError);\\n    scannerActive = true;\\n  } catch (err) {\\n    console.error(\\"Failed to initialize scanner:\\", err);\\n    toast.error(\\"Failed to initialize QR scanner\\");\\n  }\\n}\\nasync function onScanSuccess(decodedText) {\\n  if (decodedText === lastScannedUrl || processing) return;\\n  lastScannedUrl = decodedText;\\n  processing = true;\\n  try {\\n    const urlParts = decodedText.split(\\"/\\");\\n    const referenceNumber = urlParts[urlParts.length - 1];\\n    const { data: attendeeData, error } = await supabase.from(\\"attendees\\").select(\\"id, basic_info\\").eq(\\"reference_code_url\\", referenceNumber).single();\\n    if (error || !attendeeData) {\\n      toast.error(\\"Invalid QR code or attendee not found\\");\\n      return;\\n    }\\n    const audio = new Audio(\\"/sounds/success-beep.mp3\\");\\n    audio.play().catch(console.error);\\n    form.update((current) => ({\\n      ...current,\\n      attendeeId: attendeeData.id,\\n      scannedUrl: decodedText,\\n      scanType,\\n      scanNotes: \\"\\"\\n    }));\\n    const attendeeName = attendeeData.basic_info?.name || \\"Unknown Attendee\\";\\n    toast.success(\`Scanning \${attendeeName}...\`);\\n  } catch (err) {\\n    console.error(\\"Scan processing error:\\", err);\\n    toast.error(\\"Error processing scan\\");\\n  } finally {\\n    processing = false;\\n  }\\n}\\nfunction onScanError(err) {\\n  console.warn(\`QR Scan error: \${err}\`);\\n}\\nfunction toggleScanner() {\\n  if (scannerActive && scanner) {\\n    scanner.pause();\\n    scannerActive = false;\\n  } else if (scanner) {\\n    scanner.resume();\\n    scannerActive = true;\\n  }\\n}\\nonMount(() => {\\n  initializeScanner();\\n});\\nonDestroy(() => {\\n  if (scanner) {\\n    scanner.clear();\\n  }\\n});\\n<\/script>\\n\\n<svelte:head>\\n    <title>QR Scanner - {data.event.event_name}</title>\\n</svelte:head>\\n\\n<div class=\\"container mx-auto px-4 py-8\\">\\n    <div class=\\"mb-8\\">\\n        <h1 class=\\"text-3xl font-bold mb-2\\">QR Scanner</h1>\\n        <p class=\\"text-gray-600\\">{data.event.event_name}</p>\\n    </div>\\n\\n    <div class=\\"grid grid-cols-1 md:grid-cols-2 gap-8\\">\\n        <!-- Scanner Section -->\\n        <div>\\n            <Card class=\\"p-6\\">\\n                <div class=\\"space-y-4\\">\\n                    <div id=\\"qr-reader\\" bind:this={scannerElement} class=\\"w-full\\"></div>\\n                    \\n                    <div class=\\"flex justify-between items-center\\">\\n                        <Button\\n                            variant={scannerActive ? \\"destructive\\" : \\"default\\"}\\n                            on:click={toggleScanner}\\n                        >\\n                            {scannerActive ? 'Pause Scanner' : 'Resume Scanner'}\\n                        </Button>\\n                        \\n                        <div class=\\"flex items-center gap-4\\">\\n                            <Button\\n                                variant={scanType === 'entry' ? \\"default\\" : \\"outline\\"}\\n                                on:click={() => scanType = 'entry'}\\n                            >\\n                                Entry\\n                            </Button>\\n                            <Button\\n                                variant={scanType === 'exit' ? \\"default\\" : \\"outline\\"}\\n                                on:click={() => scanType = 'exit'}\\n                            >\\n                                Exit\\n                            </Button>\\n                        </div>\\n                    </div>\\n\\n                    {#if lastScannedUrl}\\n                        <div class=\\"mt-4 p-4 bg-gray-50 rounded-lg\\">\\n                            <p class=\\"font-medium\\">Last Scanned:</p>\\n                            <p class=\\"text-sm font-mono break-all\\">{lastScannedUrl}</p>\\n                        </div>\\n                    {/if}\\n                </div>\\n            </Card>\\n        </div>\\n\\n        <!-- Scan Logs Section -->\\n        <div>\\n            <Card class=\\"p-6\\">\\n                <h2 class=\\"text-xl font-semibold mb-4\\">Recent Scans</h2>\\n                <div class=\\"overflow-x-auto\\">\\n                    <Table>\\n                        <TableHeader>\\n                            <TableRow>\\n                                <TableHead>Attendee</TableHead>\\n                                <TableHead>Status</TableHead>\\n                                <TableHead>Last Scan</TableHead>\\n                            </TableRow>\\n                        </TableHeader>\\n                        <TableBody>\\n                            {#each scanLogs as attendee}\\n                                <TableRow>\\n                                    <TableCell>\\n                                        <div class=\\"flex flex-col\\">\\n                                            <span class=\\"font-medium\\">\\n                                                {getAttendeeDisplayName(attendee.basic_info)}\\n                                            </span>\\n                                            <span class=\\"text-xs text-gray-500\\">\\n                                                {attendee.reference_code_url}\\n                                            </span>\\n                                        </div>\\n                                    </TableCell>\\n                                    <TableCell>\\n                                        <span class={cn(\\n                                            \\"px-2 py-1 rounded-full text-xs font-medium\\",\\n                                            attendee.attendance_status === 'present' ? \\"bg-green-100 text-green-700\\" : \\n                                            attendee.attendance_status === 'exited' ? \\"bg-blue-100 text-blue-700\\" :\\n                                            \\"bg-gray-100 text-gray-700\\"\\n                                        )}>\\n                                            {attendee.attendance_status}\\n                                        </span>\\n                                    </TableCell>\\n                                    <TableCell>\\n                                        {#if attendee.qr_scan_info?.length}\\n                                            <div class=\\"flex flex-col\\">\\n                                                <span class=\\"text-sm\\">\\n                                                    {formatDate(attendee.qr_scan_info[attendee.qr_scan_info.length - 1].scan_time)}\\n                                                </span>\\n                                                <span class=\\"text-xs text-gray-500\\">\\n                                                    {attendee.qr_scan_info[attendee.qr_scan_info.length - 1].scan_type}\\n                                                </span>\\n                                            </div>\\n                                        {/if}\\n                                    </TableCell>\\n                                </TableRow>\\n                            {:else}\\n                                <TableRow>\\n                                    <TableCell colspan={3} class=\\"text-center py-8 text-gray-500\\">\\n                                        No scan logs yet\\n                                    </TableCell>\\n                                </TableRow>\\n                            {/each}\\n                        </TableBody>\\n                    </Table>\\n                </div>\\n            </Card>\\n        </div>\\n    </div>\\n</div>\\n\\n<style>\\n    :global(#qr-reader) {\\n        width: 100% !important;\\n        border: none !important;\\n        box-shadow: none !important;\\n    }\\n\\n    :global(#qr-reader__status) {\\n        display: none !important;\\n    }\\n\\n    :global(#qr-reader__dashboard_section_csr button) {\\n        padding: 0.5rem 1rem !important;\\n        border-radius: 0.375rem !important;\\n        background-color: #f3f4f6 !important;\\n        color: #374151 !important;\\n        font-size: 0.875rem !important;\\n        line-height: 1.25rem !important;\\n        font-weight: 500 !important;\\n        border: 1px solid #e5e7eb !important;\\n    }\\n</style>\\n"],"names":[],"mappings":"AA+OY,UAAY,CAChB,KAAK,CAAE,IAAI,CAAC,UAAU,CACtB,MAAM,CAAE,IAAI,CAAC,UAAU,CACvB,UAAU,CAAE,IAAI,CAAC,UACrB,CAEQ,kBAAoB,CACxB,OAAO,CAAE,IAAI,CAAC,UAClB,CAEQ,wCAA0C,CAC9C,OAAO,CAAE,MAAM,CAAC,IAAI,CAAC,UAAU,CAC/B,aAAa,CAAE,QAAQ,CAAC,UAAU,CAClC,gBAAgB,CAAE,OAAO,CAAC,UAAU,CACpC,KAAK,CAAE,OAAO,CAAC,UAAU,CACzB,SAAS,CAAE,QAAQ,CAAC,UAAU,CAC9B,WAAW,CAAE,OAAO,CAAC,UAAU,CAC/B,WAAW,CAAE,GAAG,CAAC,UAAU,CAC3B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CAAC,UAC9B"}`
};
function getAttendeeDisplayName(basicInfo) {
  return `${basicInfo.firstName} ${basicInfo.lastName}`;
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  superForm(data.form, {
    onResult: ({ result }) => {
      if (result.type === "success") {
        const resultData = result.data;
        toast.success(resultData?.message || "Scan recorded successfully");
        lastScannedUrl = null;
      } else if (result.type === "error") {
        toast.error("Failed to record scan");
      }
    }
  });
  let scannerElement;
  let lastScannedUrl = null;
  let scanLogs = data.scanLogs.map((log) => ({
    ...log,
    attendance_status: log.attendance_status || "registered"
  }));
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  onDestroy(() => {
  });
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$result.css.add(css);
  return `${$$result.head += `<!-- HEAD_svelte-1bf077_START -->${$$result.title = `<title>QR Scanner - ${escape(data.event.event_name)}</title>`, ""}<!-- HEAD_svelte-1bf077_END -->`, ""} <div class="container mx-auto px-4 py-8"><div class="mb-8"><h1 class="text-3xl font-bold mb-2" data-svelte-h="svelte-s8xfyi">QR Scanner</h1> <p class="text-gray-600">${escape(data.event.event_name)}</p></div> <div class="grid grid-cols-1 md:grid-cols-2 gap-8"> <div>${validate_component(Card, "Card").$$render($$result, { class: "p-6" }, {}, {
    default: () => {
      return `<div class="space-y-4"><div id="qr-reader" class="w-full"${add_attribute("this", scannerElement, 0)}></div> <div class="flex justify-between items-center">${validate_component(Button, "Button").$$render(
        $$result,
        {
          variant: "default"
        },
        {},
        {
          default: () => {
            return `${escape("Resume Scanner")}`;
          }
        }
      )} <div class="flex items-center gap-4">${validate_component(Button, "Button").$$render(
        $$result,
        {
          variant: "default"
        },
        {},
        {
          default: () => {
            return `Entry`;
          }
        }
      )} ${validate_component(Button, "Button").$$render(
        $$result,
        {
          variant: "outline"
        },
        {},
        {
          default: () => {
            return `Exit`;
          }
        }
      )}</div></div> ${lastScannedUrl ? `<div class="mt-4 p-4 bg-gray-50 rounded-lg"><p class="font-medium" data-svelte-h="svelte-i1slpa">Last Scanned:</p> <p class="text-sm font-mono break-all">${escape(lastScannedUrl)}</p></div>` : ``}</div>`;
    }
  })}</div>  <div>${validate_component(Card, "Card").$$render($$result, { class: "p-6" }, {}, {
    default: () => {
      return `<h2 class="text-xl font-semibold mb-4" data-svelte-h="svelte-1rodwe7">Recent Scans</h2> <div class="overflow-x-auto">${validate_component(Table, "Table").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Table_header, "TableHeader").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Table_row, "TableRow").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                    default: () => {
                      return `Attendee`;
                    }
                  })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                    default: () => {
                      return `Status`;
                    }
                  })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                    default: () => {
                      return `Last Scan`;
                    }
                  })}`;
                }
              })}`;
            }
          })} ${validate_component(Table_body, "TableBody").$$render($$result, {}, {}, {
            default: () => {
              return `${scanLogs.length ? each(scanLogs, (attendee) => {
                return `${validate_component(Table_row, "TableRow").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                      default: () => {
                        return `<div class="flex flex-col"><span class="font-medium">${escape(getAttendeeDisplayName(attendee.basic_info))}</span> <span class="text-xs text-gray-500">${escape(attendee.reference_code_url)} </span></div> `;
                      }
                    })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                      default: () => {
                        return `<span${add_attribute(
                          "class",
                          cn("px-2 py-1 rounded-full text-xs font-medium", attendee.attendance_status === "present" ? "bg-green-100 text-green-700" : attendee.attendance_status === "exited" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"),
                          0
                        )}>${escape(attendee.attendance_status)}</span> `;
                      }
                    })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                      default: () => {
                        return `${attendee.qr_scan_info?.length ? `<div class="flex flex-col"><span class="text-sm">${escape(formatDate(attendee.qr_scan_info[attendee.qr_scan_info.length - 1].scan_time))}</span> <span class="text-xs text-gray-500">${escape(attendee.qr_scan_info[attendee.qr_scan_info.length - 1].scan_type)}</span> </div>` : ``} `;
                      }
                    })} `;
                  }
                })}`;
              }) : `${validate_component(Table_row, "TableRow").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Table_cell, "TableCell").$$render(
                    $$result,
                    {
                      colspan: 3,
                      class: "text-center py-8 text-gray-500"
                    },
                    {},
                    {
                      default: () => {
                        return `No scan logs yet
                                    `;
                      }
                    }
                  )} `;
                }
              })}`}`;
            }
          })}`;
        }
      })}</div>`;
    }
  })}</div></div> </div>`;
});
export {
  Page as default
};
