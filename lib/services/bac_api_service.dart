import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

final Logger _logger = Logger('BacApiService');

class BacApiService {
  final String baseUrl;

  BacApiService({required this.baseUrl});

  Future<dynamic> getExampleData() async {
    final url = Uri.parse('\$baseUrl/api/usage/data');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      _logger.severe('Failed to load from bac-api: HTTP \${response.statusCode}');
      throw Exception('Failed to load from bac-api');
    }
  }

  Future<Map<String, dynamic>> fetchUsageSummary() async {
    final url = Uri.parse('\$baseUrl/api/usage/summary');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        _logger.severe('Failed to fetch usage summary: HTTP \${response.statusCode}');
        throw Exception('Failed to fetch usage summary');
      }
    } catch (e, stackTrace) {
      _logger.severe('Exception during fetchUsageSummary', e, stackTrace);
      rethrow;
    }
  }
}
