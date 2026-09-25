#include <iostream>
#include <unordered_map>
#include <string>
#include <sstream>
#include <fstream>
#include <chrono>
#include "httplib.h" 

using namespace std;

// FlashKV Core Engine
class FlashKV {
private:
    unordered_map<string, string> store;

public:
    void set(const string& key, const string& value) {
        store[key] = value;
    }

    string get(const string& key) {
        auto it = store.find(key);
        if (it != store.end()) return it->second;
        return "";
    }

    bool del(const string& key) {
        return store.erase(key) > 0;
    }

    unordered_map<string, string> getAll() {
        return store;
    }
};

int main() {
    FlashKV db;
    httplib::Server svr;

    // CORS Headers ( For connecting frontend)
    auto set_cors = [](httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    };

    // OPTIONS Route (Browser Pre-flight Check)
    svr.Options(R"(.*)", [set_cors](const httplib::Request&, httplib::Response& res) {
        set_cors(res);
        res.status = 200;
    });

    // 1. GET /all -> for fetching all data
    svr.Get("/all", [&](const httplib::Request&, httplib::Response& res) {
        set_cors(res);
        auto data = db.getAll();
        string json = "{";
        bool first = true;
        for (const auto& pair : data) {
            if (!first) json += ",";
            json += "\"" + pair.first + "\":\"" + pair.second + "\"";
            first = false;
        }
        json += "}";
        res.set_content(json, "application/json");
    });

    // 2. GET /get?key=user -> for finding value
    svr.Get("/get", [&](const httplib::Request& req, httplib::Response& res) {
        set_cors(res);
        string key = req.get_param_value("key");
        string val = db.get(key);
        if (!val.empty()) {
            res.set_content("{\"key\":\"" + key + "\",\"value\":\"" + val + "\"}", "application/json");
        } else {
            res.status = 404;
            res.set_content("{\"error\":\"Key not found\"}", "application/json");
        }
    });

    // 3. POST /set?key=user&val=Neha -> for adding key -> value
    svr.Post("/set", [&](const httplib::Request& req, httplib::Response& res) {
        set_cors(res);
        string key = req.get_param_value("key");
        string val = req.get_param_value("val");
        if (!key.empty() && !val.empty()) {
            db.set(key, val);
            res.set_content("{\"message\":\"Key set successfully\"}", "application/json");
        } else {
            res.status = 400;
            res.set_content("{\"error\":\"Missing key or val\"}", "application/json");
        }
    });

    cout << "=======================================================\n";
    cout << "  🚀 FlashKV Web API Server Running on Port 8080!       \n";
    cout << "  URL: http://localhost:8080                            \n";
    cout << "=======================================================\n";

    svr.listen("0.0.0.0", 8080);
    return 0;
}