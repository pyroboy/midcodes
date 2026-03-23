from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QLineEdit, QRadioButton, QPushButton, QLabel, QComboBox

class MyApp(QWidget):
    def __init__(self):
        super().__init__()

        self.initUI()

    def initUI(self):
        # Create layout
        layout = QVBoxLayout()

        # Create textboxes
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
        self.usermode2 = QRadioButton("Username + Password", self)
        
        # Create generate button
        self.generate_btn = QPushButton('Generate', self)

        # Add widgets to layout

        
        # Create dropdown selection
        dropdown = QComboBox(self)
        dropdown.addItem("1 - Digits + Uppercase")
        dropdown.addItem("2 - Lowercase")
        dropdown.addItem("3 - Digits")
        dropdown.addItem("4 - Uppercase")
        dropdown.addItem("5 - Letters (Uppercase + Lowercase)")
        dropdown.addItem("6 - Letters + Digits")

        # Connect signal
        dropdown.currentIndexChanged.connect(self.selectionChanged)

        # Add dropdown to layout
        layout.addWidget(dropdown)
                         


        layout.addWidget(QLabel("Prefix"))
        layout.addWidget(self.prefix)
        layout.addWidget(QLabel("Quantity"))
        layout.addWidget(self.quantity)
        layout.addWidget(QLabel("PassCode Length"))
        layout.addWidget(self.codeLength)
        layout.addWidget(QLabel("Usermode"))
        layout.addWidget(self.usermode1)
        layout.addWidget(self.usermode2)
        layout.addWidget(QLabel("Voucher Duration"))
        layout.addWidget(self.voucher_duration)
        layout.addWidget(QLabel("Voucher Validity"))
        layout.addWidget(self.voucher_validity)
        layout.addWidget(QLabel("Profile"))
        layout.addWidget(self.profile)
        layout.addWidget(QLabel("Server"))
        layout.addWidget(self.server)
        layout.addWidget(QLabel("Time Limit"))
        layout.addWidget(self.time_limit)
        layout.addWidget(QLabel("Data Limit"))
        layout.addWidget(self.data_limit)
        layout.addWidget(self.generate_btn)
        
        self.setLayout(layout)

        self.setWindowTitle('My App')
        self.show()


        self.generate_btn.clicked.connect(self.generate_function)


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

            print(f"Selected character set: {character_set}")


    def generate_function(self):

        prefix_length = len(self.prefix) + 1
        remaining_length = self.codeLength - prefix_length  # You need to get the value of length from your GUI

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



        if usermode1.isChecked():
            if usermode1.isChecked():
                voucherConfig = f"add name=\"{voucherCode}\" password=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
                voucherHtml = f"<table class=\"voucher\" style=\"width: 200px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td><td rowspan=\"3\"><div class=\"qr-wrapper\"><img class=\"qr-img p-1\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=http://{inputValues[9]}/login?username={voucherCode}&password={voucherCode}\"></div></td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size: 11px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"
            else:
                voucherConfig = f"add name=\"{voucherCode}\" password=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
                voucherHtml = f"<table class=\"voucher\" style=\"width: 160px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size: 12px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"
        else:
            if usermode2.isChecked():
                voucherConfig = f"add name=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
                voucherHtml = f"<table class=\"voucher\" style=\"width: 200px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td><td rowspan=\"3\"><div class=\"qr-wrapper\"><img class=\"qr-img p-1\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=http://{inputValues[9]}/login?username={voucherCode}\"></div></td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size:11px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"
            else:
                voucherConfig = f"add name=\"{voucherCode}\" server=\"{inputValues[8]}\" profile=\"{inputValues[7]}\" comment=\"{inputValues[5]},{inputValues[2]},0,{inputValues[0]}\" limit-uptime=\"{inputValues[4]}\" limit-bytes-total=\"{inputValues[6]}\" "
                voucherHtml = f"<table class=\"voucher\" style=\"width: 160px;\"><tbody><tr><td class=\"rotate\" style=\"font-weight: bold; border-right: 1px solid black; background-color:{inputValues[11]}; -webkit-print-color-adjust: exact;\" rowspan=\"4\"><span>{inputValues[10]} {inputValues[2]}</span></td><td style=\"font-weight: bold\" colspan=\"2\">{inputValues[0]}</td></tr><tr><td style=\"width: 100%; font-weight: bold; font-size: 18px; text-align: center;\">{voucherCode}</td></tr><tr><td style=\"font-size: 12px;\"> Duration: {voucherDuration}</td></tr><tr><td colspan=\"3\" style=\"font-size: 12px;\"> Login: http://<span style=\"font-weight: bold;\">{inputValues[9]}</span></td></tr></tbody></table>"
            pass

if __name__ == '__main__':
    app = QApplication([])
    ex = MyApp()
    app.exec_()