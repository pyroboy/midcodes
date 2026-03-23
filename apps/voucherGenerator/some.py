import random
import string

def generate_vouchers():
    # Get values from input elements and store them in a list
    input_values = [
        vendo,  # You need to get the value from your GUI
        prefix,  # You need to get the value from your GUI
        price,  # You need to get the value from your GUI
        quantity,  # You need to get the value from your GUI
        #...
    ]

    # Calculate prefix_length and remaining_length values
    prefix_length = len(input_values[1]) + 1
    remaining_length = length - prefix_length  # You need to get the value of length from your GUI

    # Determine the character set based on the value in input_values[12]
    character_set = ''
    char = input_values[12]  # You need to get the value from your GUI
    if char == '1':
        character_set = string.digits + string.ascii_uppercase
    elif char == '2':
        character_set = string.ascii_lowercase
    elif char == '3':
        character_set = string.digits
    elif char == '4':
        character_set = string.ascii_uppercase
    elif char == '5':
        character_set = string.ascii_letters
    elif char == '6':
        character_set = string.ascii_letters + string.digits

    # Calculate voucher_duration based on input values
    # ...

    voucher_output = ''  # Initialize an empty string
    print_body = ''  # Initialize an empty string

    # Generate content in a loop
    for i in range(input_values[3]):
        voucher_code = input_values[1]
        for j in range(remaining_length):
            random_index = random.randint(0, len(character_set) - 1)
            voucher_code += character_set[random_index]

        # Generate content based on conditions
        # ...

        # Append the generated content to voucher_output and print_body
        voucher_output += voucher_config + "\n"
        print_body += voucher_html + "\n"

    # Update elements with the generated content
    # ...


    voucherConfig = ""
voucherHtml = ""

# Generate content based on conditions
if userpass.isChecked():
    if qrcodebtn.isChecked():
        voucherConfig = f"add name=\"{voucherCode}\" password=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
        voucherHtml = f"<table class=\"voucher\" style=\"width: 200px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td><td rowspan=\"3\"><div class=\"qr-wrapper\"><img class=\"qr-img p-1\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=http://{inputValues[9]}/login?username={voucherCode}&password={voucherCode}\"></div></td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size: 11px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"
    else:
        voucherConfig = f"add name=\"{voucherCode}\" password=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
        voucherHtml = f"<table class=\"voucher\" style=\"width: 160px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size: 12px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"
else:
    if qrcodebtn.isChecked():
        voucherConfig = f"add name=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
        voucherHtml = f"<table class=\"voucher\" style=\"width: 200px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td><td rowspan=\"3\"><div class=\"qr-wrapper\"><img class=\"qr-img p-1\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=http://{inputValues[9]}/login?username={voucherCode}\"></div></td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size:11px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"
    else:
        voucherConfig = f"add name=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
        voucherHtml = f"<table class=\"voucher\" style=\"width: 160px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size: 12px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"