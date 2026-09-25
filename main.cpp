// JAI SHREE GANESH
#include <iostream>
#include <unordered_map>
#include <string>
#include <sstream>
#include <fstream>
#include <chrono>

using namespace std;

// FlashKV Core Engine (RAM MEMORY STORAGE)
class FlashKV {
private:
    unordered_map<string, string> store;

public:
    void set(const string& key, const string& value) {
        store[key] = value; // Single '=' for assignment
        cout << "[FlashKV] SUCCESS: Key '" << key << "' set in memory.\n";
    }

    void get(const string& key) {
        auto it = store.find(key);
        if (it != store.end()) {
            cout << "[FlashKV] OUTPUT: " << it->first << " => " << it->second << "\n";
        } else {
            cout << "[FlashKV] ERROR: Key '" << key << "' not found.\n";
        }
    }

    void del(const string& key) {
        if (store.erase(key)) {
            cout << "[FlashKV] SUCCESS: Key '" << key << "' deleted.\n";
        } else {
            cout << "[FlashKV] ERROR: Key '" << key << "' not found!\n";
        }
    }

    void showAll() {
        if (store.empty()) {
            cout << "[FlashKV] INFO: Storage is currently empty.\n";
            return;
        }

        cout << "--- FlashKV Memory Snapshot ---\n";
        for (const auto& pair : store) {
            cout << "  " << pair.first << " : " << pair.second << "\n";
        }
        cout << "-------------------------------\n";
    }
    void saveToFile(const string & filename = "snapshot.txt") {
        ofstream outFile(filename);
        if(!outFile) {
            cout << "[FlashKV] ERROR : Could not open file for saving!\n";
            return;
        }
        for(const auto& pair : store) {
            outFile << pair.first << " " << pair.second  << "\n";
        }
        outFile.close();
        cout << "[FlashKV] SUCCESS: Snapshot saved to '" << filename << "' .\n";
    }
    void loadFromFile(const string &filename = "snapshot.txt") {
        ifstream inFile(filename);
        if(!inFile) {
            cout << "[FlashKV] INFO: No existing snapshotfound. Starting fresh.\n";
            return;
        }
        string key, value;
        int count = 0;
        while(inFile >> key >> value) {
            store[key] = value;
            count ++;
        }
        inFile.close();
        cout << "[FlashKV] SUCCESS : Loaded" << count << "keys from ' "<< filename << "'.\n";
    }
};

// Interactive CLI Shell
int main() {
    FlashKV db;
    db.loadFromFile();
    string inputLine;

    cout << "=======================================================\n";
    cout << "   ⚡ FlashKV v1.0 - High-Speed In-Memory Engine ⚡    \n";
    cout << "   Commands: SET <k> <v> | GET <k> | DEL <k> | SHOWALL | EXIT\n";
    cout << "=======================================================\n\n";

    while (true) {
        cout << "flashkv> ";
        if (!getline(cin, inputLine) || inputLine.empty()) continue;

        stringstream ss(inputLine);
        string command, key, value;
        ss >> command;

        if (command == "EXIT" || command == "exit") {
            db.saveToFile();
            cout << "[FlashKV] Shutting down storage engine. Bye!\n";
            break;
        }
        else if (command == "SET" || command == "set") {
            if (ss >> key >> value) {
                auto start = chrono::high_resolution_clock::now();
                db.set(key, value);
                auto end = chrono::high_resolution_clock::now();
                auto duration = chrono::duration_cast<chrono::microseconds>(end - start).count();
                cout << "[Profiler] Latency : " << duration << " us \n";
            } 
            else {
                cout << "[USAGE] SET <key> <value>\n";
            }
        }
        else if (command == "GET" || command == "get") {
            if (ss >> key) {
                auto start = chrono::high_resolution_clock::now();
                db.get(key);
                auto end = chrono::high_resolution_clock::now();
                auto duration = chrono::duration_cast<chrono::microseconds>(end - start).count();
                cout << "[Profiler] Latency : " << duration << " us \n";

            } else {
                cout << "[USAGE] GET <key>\n";
            }
        }
        else if (command == "DEL" || command == "del") {
            if (ss >> key) {
                auto start = chrono::high_resolution_clock::now();
                db.del(key);
                auto end = chrono::high_resolution_clock::now();
                auto duration = chrono::duration_cast<chrono::microseconds>(end - start).count();
                cout << "[Profiler] Latency : " << duration << " us \n";
            } else {
                cout << "[USAGE] DEL <key>\n";
            }
        }
        else if (command == "SHOWALL" || command == "showall") {
            db.showAll();
        }
        else {
            cout << "[ERROR] Invalid Command! Try SET, GET, DEL, SHOWALL, or EXIT.\n";
        }
        cout << "\n";
    }

    return 0;
}