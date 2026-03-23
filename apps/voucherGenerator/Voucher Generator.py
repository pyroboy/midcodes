import random
import string
import os
from PyQt5.QtWidgets import QApplication, QWidget, QHBoxLayout,QVBoxLayout, QLineEdit, QRadioButton, QPushButton, QLabel, QComboBox, QCheckBox
def get_filenames_from_folder(folder_name):
    script_dir = os.path.dirname(os.path.realpath(__file__))

    # Construct the full path to the folder
    folder_path = os.path.join(script_dir, folder_name)
    try:
        filenames = os.listdir(folder_path)
        return filenames
    except FileNotFoundError:
        print(f"Folder not found: {folder_path}")
        return []
class MyApp(QWidget):
    def __init__(self):
        super().__init__()
        self.selected_template = "defaultvoucher.html"
        self.folder_name = "template"
        self.presets = {
            "Preset 1": {"hotspot": "Hotspot1", "prefix": "P1", "quantity": "100"},
            "Preset 2": {"hotspot": "Hotspot2", "prefix": "P2", "quantity": "200"},
            # ... more presets
        }
        self.initUI()


    def initUI(self):
        # Create layout


        main_layout = QVBoxLayout(self)  # Main layout

        # Create horizontal layout for the two columns
        columns_layout = QHBoxLayout()
        left_layout = QVBoxLayout()
        right_layout = QVBoxLayout()

        
        # Create textboxes
        self.hotspot = QLineEdit(self)
        self.prefix = QLineEdit(self)
        self.quantity = QLineEdit(self)
        self.codeLength = QLineEdit(self)
        self.voucher_duration = QLineEdit(self)
        self.voucher_validity = QLineEdit(self)
        self.profile = QLineEdit(self)
        self.server = QLineEdit(self)
        self.time_limit = QLineEdit(self)
        self.data_limit = QLineEdit(self)

        # Create radio buttons
        self.usermode1 = QRadioButton("Username = Password", self)
        self.usermode2 = QRadioButton("Username only", self)
        
        self.checkbox = QCheckBox("with QR ?")
        
        # self.checkbox.setChecked(True)  # Set initial checked state (optional)

        # Create generate button
        self.generate_btn = QPushButton('Generate', self)

        # Add widgets to layout

        # Create dropdown selection
        self.dropdown = QComboBox(self)  # Added self.dropdown here
        self.dropdown.addItem("1 - Digits + Uppercase")
        self.dropdown.addItem("2 - Lowercase")
        self.dropdown.addItem("3 - Digits")
        self.dropdown.addItem("4 - Uppercase")
        self.dropdown.addItem("5 - Letters (Uppercase + Lowercase)")
        self.dropdown.addItem("6 - Letters + Digits")
        self.dropdown.addItem("7 -  punctuation characters")
        self.dropdown.addItem("8 - hexadecimal digits (0-9, A-F, a-f")
        self.dropdown.addItem("9 -  combination of digits, uppercase and lowercase letters, and punctuation.")

        # self.dropdown = QComboBox(self)  # Added self.dropdown here

        self.template_dropdown = QComboBox(self)

        # Populate the dropdown with filenames from the "template" folder
        template_filenames = get_filenames_from_folder(self.folder_name)
        for filename in template_filenames:
            self.template_dropdown.addItem(filename)

        # Add the new dropdown to the layout

        # Connect signal

    # Connect a slot to handle checkbox state changes (optional)
        self.checkbox.stateChanged.connect(self.handle_checkbox_state_change)

        self.dropdown.currentIndexChanged.connect(self.selectionChanged)
        self.template_dropdown.currentIndexChanged.connect(self.templateSelectionChanged)
        # Add dropdown to layout
        left_layout.addWidget(QLabel("Character Set"))
        left_layout.addWidget(self.dropdown)

        left_layout.addWidget(QLabel("Select Template"))
        left_layout.addWidget(self.template_dropdown)
        left_layout.addWidget(QLabel("HotspotName"))
        left_layout.addWidget(self.hotspot)
        left_layout.addWidget(QLabel("Prefix"))
        left_layout.addWidget(self.prefix)
        left_layout.addWidget(QLabel("Quantity"))
        left_layout.addWidget(self.quantity)
        left_layout.addWidget(QLabel("PassCode Length"))
        left_layout.addWidget(self.codeLength)
        left_layout.addWidget(QLabel("Usermode"))
        left_layout.addWidget(self.usermode1)
        left_layout.addWidget(self.usermode2)
        left_layout.addWidget(self.checkbox)
        # layout.addWidget(QLabel("QR"))



        right_layout.addWidget(QLabel("Voucher Duration"))
        right_layout.addWidget(self.voucher_duration)
        right_layout.addWidget(QLabel("Voucher Validity"))
        right_layout.addWidget(self.voucher_validity)
        right_layout.addWidget(QLabel("Profile"))
        right_layout.addWidget(self.profile)
        right_layout.addWidget(QLabel("Server"))
        right_layout.addWidget(self.server)
        right_layout.addWidget(QLabel("Time Limit"))
        right_layout.addWidget(self.time_limit)
        right_layout.addWidget(QLabel("Data Limit"))
        right_layout.addWidget(self.data_limit)

        generate_btn_layout = QHBoxLayout()
        generate_btn_layout.addStretch()  # Add stretch to center the button
        generate_btn_layout.addWidget(self.generate_btn)
        generate_btn_layout.addStretch()

        columns_layout.addLayout(left_layout)
        columns_layout.addLayout(right_layout)

        # Add the columns layout to the main layout
        main_layout.addLayout(columns_layout)

        main_layout.addLayout(generate_btn_layout)
        self.setLayout(main_layout)

        self.setWindowTitle('Voucher Code Generator')
        self.show()

        self.generate_btn.clicked.connect(self.generate_function)


    def handle_checkbox_state_change(state):
        if state == 0:
            print("Checkbox is unchecked")
        elif state == 2:
            print("Checkbox is checked")
    def selectionChanged(self, index):
        char = str(index + 1)  # Get the selected index and convert it to a string
        character_set = ''

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
        elif char == '7':
            character_set = string.punctuation
        elif char == '8':
            character_set = string.hexdigits
        elif char == '9':
            character_set = string.digits + string.ascii_lowercase + string.ascii_uppercase + string.punctuation
        # ... add more options as needed

        print(f"Selected character set: {character_set}")

    def templateSelectionChanged(self, index):
        self.selected_template = self.template_dropdown.itemText(index)
        print(f"Selected template: {self.selected_template}")
        # Add any additional logic you need when a new template is selected

    def generate_function(self):
        # Get values from input elements and convert them to appropriate types

        
        input_values = {
            "hotspot": self.hotspot.text(),
            "prefix": self.prefix.text(),
            "quantity": int(self.quantity.text()),
            "codeLength": int(self.codeLength.text()),
            "voucher_duration": self.voucher_duration.text(),
            "voucher_validity": self.voucher_validity.text(),
            "profile": self.profile.text(),
            "server": self.server.text(),
            "time_limit": self.time_limit.text(),
            "data_limit": self.data_limit.text(),
            "checkbox": self.checkbox.isChecked(),
            "usermode1": self.usermode1.isChecked(),
            "usermode2": self.usermode2.isChecked()
        }

        # Calculate prefix_length and remaining_length values
        prefix_length = len(input_values["prefix"]) + 1
        # remaining_length = input_values["codeLength"] - prefix_length
        remaining_length = input_values["codeLength"]

        # Determine the character set based on the selected index in the dropdown
        selected_index = self.dropdown.currentIndex()
        char = str(selected_index + 1)
        character_set = ''

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
        elif char == '7':
            character_set = string.punctuation
        elif char == '8':
            character_set = string.hexdigits
        elif char == '9':
            character_set = string.digits + string.ascii_lowercase + string.ascii_uppercase + string.punctuation


        if not character_set:
            print("Character set is empty. Please select a valid character set.")
            return

        voucherOutput = ''  # Initialize an empty string
        printBody = ''  # Initialize an empty string
        voucherConfig = f"/ip hotspot user"
        voucherHtml = ""
        voucherOutput += voucherConfig + "\n"



        # Generate content in a loop
        print(range(input_values["quantity"]))
        for i in range(input_values["quantity"]):
            voucherCode = input_values["prefix"]
            for j in range(remaining_length):
                random_index = random.randint(0, len(character_set) - 1)
                voucherCode += character_set[random_index]

            # Generate content based on conditions
            # ...

            # Append the generated content to voucher_output and print_body
            # voucherOutput += voucherConfig + "\n"
            # printBody += voucherHtml + "\n"

        # Update elements with the generated content
        # ...


            script_dir = os.path.dirname(os.path.realpath(__file__))
            folder_path = os.path.join(script_dir, self.folder_name,self.selected_template)
            print(f"Folder Path: {folder_path}")
            with open(folder_path, 'r') as file:
                voucherHtml = file.read()


        # ['hotspotName',
        #  'username',
        # %password% 
        # 'limitUptime',
        # ,count
        #  %limitBytesTotal%,
        # %price%<]
                # Replace the desired strings
                voucherHtml = voucherHtml.replace("%hotspotName%", input_values['hotspot'])
                voucherHtml = voucherHtml.replace('{{codeLength}}', str(input_values['codeLength']))
                voucherHtml = voucherHtml.replace('{{prefix}}', input_values['prefix'])
                voucherHtml = voucherHtml.replace('{{server}}', input_values['server'])
                voucherHtml = voucherHtml.replace('%username%', voucherCode)
                voucherHtml = voucherHtml.replace('%limitUptime%', input_values['time_limit'])

            

            voucherConfig = (
                f"add name=\"{voucherCode}\" password=\"{voucherCode}\" server=\"{input_values['server']}\" "
                f"profile=\"{input_values['profile']}\" comment=\"{input_values['voucher_validity']},{input_values['codeLength']},0,{input_values['prefix']}\" "
                f"limit-uptime=\"{input_values['time_limit']}\""
                # f"limit-bytes-total=\"{input_values['data_limit']}\" "
            )
            # voucherHtml = (
            #     f"<table class=\"voucher\" style=\"width: 200px;\">\n"
            #     f"  <tbody>\n"
            #     f"    <tr>\n"
            #     f"      <td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{input_values['voucher_validity']}; -webkit-print-color-adjust: exact;\" rowspan=\"4\">\n"
            #     f"        <span>{input_values['voucher_duration']} {input_values['codeLength']}</span>\n"
            #     f"      </td>\n"
            #     f"      <td style=\"font-weight: bold\" colspan=\"2\">\n"
            #     f"        {input_values['prefix']}\n"
            #     f"      </td>\n"
            #     f"      <td rowspan=\"3\">\n"
            #     f"        <div class=\"qr-wrapper\">\n"
            #     f"          <img class=\"qr-img p-1\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=http://{input_values['server']}/login?username={voucherCode}&password={voucherCode}\">\n"
            #     f"        </div>\n"
            #     f"      </td>\n"
            #     f"    </tr>\n"
            #     f"    <tr>\n"
            #     f"      <td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">\n"
            #     f"        {voucherCode}\n"
            #     f"      </td>\n"
            #     f"    </tr>\n"
            #     f"    <tr>\n"
            #     f"      <td style=\"font-size: 11px;\">\n"
            #     f"        Duration: {input_values['voucher_duration']}\n"
            #     f"      </td>\n"
            #     f"    </tr>\n"
            #     f"    <tr>\n"
            #     f"      <td colspan=\"3\" style=\"font-size: 12px;\">\n"
            #     f"        Login: http://<span style=\"font-weight: bold;\">{input_values['server']}</span>\n"
            #     f"      </td>\n"Figaro
            #     f"    </tr>\n"
            #     f"  </tbody>\n"
            #     f"</table>\n"
            #     )

            voucherOutput += voucherConfig + "\n"
            printBody += voucherHtml 
            # printBody += voucherHtml +  "<br>"


        # voucherOutput += voucherConfig 
        # printBody += voucherHtml
        # print(f"Selected character set: {character_set}")
        # print(f"{voucherOutput}")
        # print(f"{printBody}")
        script_dir = os.path.dirname(os.path.realpath(__file__))

        # Construct the full path to the folder
        style_path = os.path.join(script_dir, 'style/style.html')
        voucher_path = os.path.join(script_dir, "vouchers.html")
        script_path = os.path.join(script_dir, "script.txt")
        with open(style_path, 'r') as file:
            style = file.read()
        try:
            with open(voucher_path, "w") as file:
                file.write("<html>\n")
                file.write('<script src="assets/js/jquery.min.js"></script>\n')
                file.write(style)
                file.write("<body>\n")
                file.write(printBody)
                file.write("<script>window.onload = window.print()</script>\n")
                file.write("</body>\n")
                file.write("</html>\n")
        except Exception as e:
            print(f"Error writing to file: {e}")
        try:
            with open(script_path, "w") as file:
                file.write(voucherOutput)
        except Exception as e:
            print(f"Error writing to file: {e}")
        pass

  
        # print(f"{voucherHtml}")

if __name__ == '__main__':
    app = QApplication([])
    ex = MyApp()
    app.exec_()
