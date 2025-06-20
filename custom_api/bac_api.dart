import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_constants.dart';

class BacApi {
  final http.Client _client;

  BacApi({http.Client? client}) : _client = client ?? http.Client();

  Future<Map<String, dynamic>> fetchData() async {
    try {
      final response = await _client.get(
        Uri.parse("\${ApiConstants.baseUrl}\${ApiConstants.getData}"),
      );
      return jsonDecode(response.body);
    } catch (e) {
      throw Exception("API Error: \$e");
    }
  }
  Future<void> sendCommand(String command) async {
    await _client.post(
      Uri.parse("\${ApiConstants.baseUrl}\${ApiConstants.sendCommand}"),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'command': command}),
    );
  }
  Future<Map<String, dynamic>> fetchUsageSummary() async {
    try {
      final response = await _client.get(
        Uri.parse("\${ApiConstants.baseUrl}\${ApiConstants.usageSummary}"),
      );
      return jsonDecode(response.body);
    } catch (e) {
      throw Exception("Failed to fetch usage summary: \$e");
    }
  }

  Future<Map<String, dynamic>> fetchUsageData({String period = 'day'}) async {
    try {
      final uri = Uri.parse("\${ApiConstants.baseUrl}\${ApiConstants.usageData}").replace(queryParameters: {'period': period});
      final response = await _client.get(uri);
      return jsonDecode(response.body);
    } catch (e) {
      throw Exception("Failed to fetch usage data: \$e");
    }
  }

  Future<Map<String, dynamic>> fetchUsageInsights() async {
    try {
      final response = await _client.get(
        Uri.parse("\${ApiConstants.baseUrl}\${ApiConstants.usageInsights}"),
      );
      return jsonDecode(response.body);
    } catch (e) {
      throw Exception("Failed to fetch usage insights: \$e");
    }
  }

  Future<Map<String, dynamic>> fetchSensorData() async {
    try {
      final response = await _client.get(
        Uri.parse("\${ApiConstants.baseUrl}\${ApiConstants.sensorData}"),
      );
      return jsonDecode(response.body);
    } catch (e) {
      throw Exception("Failed to fetch sensor data: \$e");
    }
  }
}
