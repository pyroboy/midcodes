    else:
            #         voucherConfig = (
            #             f"add name=\"{voucherCode}\" password=\"{voucherCode}\" server=\"{input_values['server']}\" "
            #             f"profile=\"{input_values['profile']}\" comment=\"{input_values['voucher_validity']},{input_values['codeLength']},0,{input_values['prefix']}\" "
            #             f"limit-uptime=\"{input_values['time_limit']}\" limit-bytes-total=\"{input_values['data_limit']}\" "
            #             )
            #         voucherHtml = (
            #             f"<table class=\"voucher\" style=\"width: 160px;\">\n"
            #             f"  <tbody>\n"
            #             f"    <tr>\n"
            #             f"      <td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{input_values['voucher_validity']}; -webkit-print-color-adjust: exact;\" rowspan=\"4\">\n"
            #             f"        <span>{input_values['voucher_duration']} {input_values['codeLength']}</span>\n"
            #             f"      </td>\n"
            #             f"      <td style=\"font-weight: bold\" colspan=\"2\">\n"
            #             f"        {input_values['prefix']}\n"
            #             f"      </td>\n"
            #             f"    </tr>\n"
            #             f"    <tr>\n"
            #             f"      <td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">\n"
            #             f"        {voucherCode}\n"
            #             f"      </td>\n"
            #             f"    </tr>\n"
            #             f"    <tr>\n"
            #             f"      <td style=\"font-size: 12px;\">\n"
            #             f"        Duration: {input_values['voucher_duration']}\n"
            #             f"      </td>\n"
            #             f"    </tr>\n"
            #             f"    <tr>\n"
            #             f"      <td colspan=\"3\" style=\"font-size: 12px;\">\n"
            #             f"        Login: http://<span style=\"font-weight: bold;\">{input_values['server']}</span>\n"
            #             f"      </td>\n"
            #             f"    </tr>\n"
            #             f"  </tbody>\n"
            #             f"</table>\n"
            #         )
            # else:
            #     if input_values["checkbox"]:
            #         voucherConfig = f"add name=\"{voucherCode}\" server=\"{input_values['server']}\" profile=\"{input_values['profile']}\" comment=\"{input_values['voucher_validity']},{input_values['codeLength']},0,{input_values['prefix']}\" limit-uptime=\"{input_values['time_limit']}\" limit-bytes-total=\"{input_values['data_limit']}\" "
            #         voucherHtml = f"<table class=\"voucher\" style=\"width: 200px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{input_values['voucher_validity']}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{input_values['voucher_duration']} {input_values['codeLength']}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{input_values['prefix']}</td><td rowspan=\"3\"><div class=\"qr-wrapper\"><img class=\"qr-img p-1\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=http://{input_values['server']}/login?username={voucherCode}\"></div></td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size:11px;\"> Duration: {input_values['voucher_duration']}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{input_values['server']}</span></td></tr></tbody></table>"
            #     else:
            #         voucherConfig = f"add name=\"{voucherCode}\" server=\"{input_values['server']}\" profile=\"{input_values['profile']}\" comment=\"{input_values['voucher_validity']},{input_values['codeLength']},0,{input_values['prefix']}\" limit-uptime=\"{input_values['time_limit']}\" limit-bytes-total=\"{input_values['data_limit']}\" "
            #         voucherHtml = f"<table class=\"voucher\" style=\"width: 160px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{input_values['voucher_validity']}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{input_values['voucher_duration']} {input_values['codeLength']}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{input_values['prefix']}</td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size: 12px;\"> Duration: {input_values['voucher_duration']}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{input_values['server']}</span></td></tr></tbody></table>"
