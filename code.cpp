#include <iostream>
#include <string>

using namespace std;

// ------------------------------------------------------------
// CRC Calculator
// Cyclic Redundancy Check - Error Detection Technique
// ------------------------------------------------------------

bool isBinary(const string& input)
{
    if (input.empty())
        return false;

    for (char bit : input)
    {
        if (bit != '0' && bit != '1')
            return false;
    }

    return true;
}

// Performs modulo-2 division using XOR
string calculateRemainder(const string& data, const string& generator)
{
    const size_t generatorLength = generator.length();

    string remainder = data.substr(0, generatorLength);

    for (size_t i = generatorLength; i <= data.length(); ++i)
    {
        // If leading bit is 1, perform XOR with generator
        if (remainder[0] == '1')
        {
            for (size_t j = 0; j < generatorLength; ++j)
            {
                remainder[j] =
                    (remainder[j] == generator[j]) ? '0' : '1';
            }
        }

        // Remove the leftmost bit
        remainder.erase(0, 1);

        // Bring down the next bit
        if (i < data.length())
            remainder += data[i];
    }

    return remainder;
}

bool validateInput(const string& data, const string& generator)
{
    if (!isBinary(data))
    {
        cout << "Error: Data must contain only 0 and 1.\n";
        return false;
    }

    if (!isBinary(generator))
    {
        cout << "Error: Generator must contain only 0 and 1.\n";
        return false;
    }

    if (generator.length() < 2)
    {
        cout << "Error: Generator must contain at least 2 bits.\n";
        return false;
    }

    if (generator[0] != '1')
    {
        cout << "Error: Generator must start with 1.\n";
        return false;
    }

    if (data.length() < generator.length())
    {
        cout << "Error: Data must be longer than or equal to generator.\n";
        return false;
    }

    return true;
}

// ------------------------------------------------------------
// Generate CRC
// ------------------------------------------------------------

void generateCRC()
{
    string data;
    string generator;

    cout << "\n========== Generate CRC ==========\n";

    cout << "Enter data: ";
    cin >> data;

    cout << "Enter generator: ";
    cin >> generator;

    if (!validateInput(data, generator))
        return;

    // Append zeros equal to generator length - 1
    string appendedData =
        data + string(generator.length() - 1, '0');

    string crc = calculateRemainder(appendedData, generator);

    string transmittedData = data + crc;

    cout << "\n---------- CRC Result ----------\n";
    cout << "Original Data    : " << data << '\n';
    cout << "Generator        : " << generator << '\n';
    cout << "CRC Remainder    : " << crc << '\n';
    cout << "Transmitted Data : " << transmittedData << '\n';
}

// ------------------------------------------------------------
// Verify Received Data
// ------------------------------------------------------------

void verifyCRC()
{
    string receivedData;
    string generator;

    cout << "\n========== Verify CRC ==========\n";

    cout << "Enter received data: ";
    cin >> receivedData;

    cout << "Enter generator: ";
    cin >> generator;

    if (!validateInput(receivedData, generator))
        return;

    string remainder =
        calculateRemainder(receivedData, generator);

    cout << "\n---------- Verification Result ----------\n";
    cout << "Received Data : " << receivedData << '\n';
    cout << "Generator     : " << generator << '\n';
    cout << "Remainder     : " << remainder << '\n';

    if (remainder.find('1') != string::npos)
    {
        cout << "Result        : ERROR DETECTED!\n";
    }
    else
    {
        cout << "Result        : NO ERROR DETECTED.\n";
    }
}

// ------------------------------------------------------------
// Project Information
// ------------------------------------------------------------

void showInformation()
{
    cout << "\n========== Project Information ==========\n";
    cout << "CRC stands for Cyclic Redundancy Check.\n";
    cout << "It is an error detection technique used in\n";
    cout << "computer networks and data communication.\n\n";

    cout << "Working Principle:\n";
    cout << "1. Data is combined with extra zero bits.\n";
    cout << "2. Modulo-2 division is performed.\n";
    cout << "3. XOR operation is used during division.\n";
    cout << "4. The remainder is called the CRC.\n";
    cout << "5. The receiver checks the remainder to detect errors.\n";
}

// ------------------------------------------------------------
// Display Menu
// ------------------------------------------------------------

void displayMenu()
{
    cout << "\n========================================\n";
    cout << "          CRC CALCULATOR - C++\n";
    cout << "========================================\n";
    cout << "1. Generate CRC\n";
    cout << "2. Verify Received Data\n";
    cout << "3. Project Information\n";
    cout << "4. Exit\n";
    cout << "----------------------------------------\n";
    cout << "Enter your choice: ";
}

// ------------------------------------------------------------
// Main Function
// ------------------------------------------------------------

int main()
{
    int choice;

    do
    {
        displayMenu();
        cin >> choice;

        switch (choice)
        {
            case 1:
                generateCRC();
                break;

            case 2:
                verifyCRC();
                break;

            case 3:
                showInformation();
                break;

            case 4:
                cout << "\nThank you for using CRC Calculator!\n";
                break;

            default:
                cout << "\nInvalid choice. Please select 1-4.\n";
        }

    } while (choice != 4);

    return 0;
}