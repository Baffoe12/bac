import 'dart:io';

import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_anna_22/pages/notes_page.dart';
import 'package:flutter_anna_22/pages/onboarding_page.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logging/logging.dart';
import 'package:flutter_anna_22/widgets/main_scaffold.dart';
import 'package:flutter_anna_22/pages/welcome_page.dart';
import 'package:flutter_anna_22/pages/login_page.dart';
import 'package:flutter_anna_22/pages/signup_page.dart';
import 'package:flutter_anna_22/widgets/splash_screen.dart';
import 'package:flutter_anna_22/data/constants.dart';
import 'package:flutter_anna_22/data/notifiers.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'firebase_options.dart';
// ignore: depend_on_referenced_packages
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

import 'package:flutter_anna_22/custom_api/bac_api.dart'; 
final _logger = Logger('MyApp');

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ✅ iOS WebView platform initialization
  if (Platform.isIOS) {
    WebViewPlatform.instance = WebKitWebViewPlatform();
  }

  Logger.root.level = Level.ALL;
  Logger.root.onRecord.listen((record) {
    debugPrint('\${record.level.name}: \${record.time}: \${record.message}');
    if (record.error != null) {
      debugPrint('Error: \${record.error}');
    }
    if (record.stackTrace != null) {
      debugPrint('StackTrace: \${record.stackTrace}');
    }
  });

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    _logger.info('Firebase initialized successfully');
  } on FirebaseException catch (e, stackTrace) {
    if (e.code == 'duplicate-app') {
      _logger.warning('Firebase already initialized');
    } else {
      _logger.severe('Firebase initialization failed', e, stackTrace);
    }
  }
   // required only if you use Android later
  runApp(const MyHome());
}

class MyHome extends StatefulWidget {
  const MyHome({super.key});

  @override
  State<MyHome> createState() => _MyHomeState();
}

class _MyHomeState extends State<MyHome> {
  late BacApiService _bacApiService;
  String _apiData = '';

  @override
  void initState() {
    super.initState();
    _bacApiService = BacApiService(baseUrl: "https://bac-e72u.onrender.com");
    _initializeApp();
    _fetchApiData();
  }

  Future<void> _fetchApiData() async {
    try {
      final data = await _bacApiService.fetchUsageSummary();
      setState(() {
        _apiData = data.toString();
      });
      _logger.fine('Fetched usage summary from bac-api');
    } catch (e, stackTrace) {
      _logger.severe('Failed to fetch usage summary from bac-api', e, stackTrace);
      print('Error: \$e');
      print('StackTrace: \$stackTrace');
    }
  }

  Future<void> _initializeApp() async {
    try {
      await initThemeMode();
      await initAppData(); // Initialize credit data
      _logger.fine('App initialization completed');
    } catch (e, stackTrace) {
      _logger.severe('App initialization failed', e, stackTrace);
    }
  }

  Future<void> initAppData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load credit values
    remainingCreditNotifier.value = prefs.getDouble('remainingCredit') ?? 0.0;
    maxCreditNotifier.value = prefs.getDouble('maxCredit') ?? 0.0;
    
    // Load transactions
    final transactions = prefs.getStringList('transactions') ?? [];
    transactionHistoryNotifier.value = transactions.map((t) {
      final parts = t.split(',');
      return Transaction(
        amount: double.parse(parts[0]),
        date: DateTime.fromMillisecondsSinceEpoch(int.parse(parts[1])),
        isCredit: parts[2] == 'true',
        reference: parts[3] == 'null' ? null : parts[3],
      );
    }).toList();
  }

  Future<void> initThemeMode() async {
    try {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final bool? isDark = prefs.getBool(Kconstants.themeModeKey);
      isDarkModeNotifier.value = isDark ?? false;
      _logger.fine('Theme mode initialized: \${isDarkModeNotifier.value}');
    } catch (e, stackTrace) {
      _logger.warning('Failed to load theme preferences', e, stackTrace);
      isDarkModeNotifier.value = false;
    }
  }

  ThemeData _buildThemeData(bool isDarkMode) {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.teal,
        brightness: isDarkMode ? Brightness.dark : Brightness.light,
        primary: Colors.teal,
        secondary: Colors.tealAccent,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor:
          isDarkMode ? const Color(0xFF121212) : Colors.grey[50],
      cardColor: isDarkMode ? const Color(0xFF1E1E1E) : Colors.white,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(
          color: isDarkMode ? Colors.white : Colors.black87,
          fontSize: 28,
          fontWeight: FontWeight.bold,
        ),
        bodyMedium: TextStyle(
          color: isDarkMode ? Colors.grey[400] : Colors.grey[700],
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor:
              isDarkMode ? const Color(0xFF2A2A2A) : Colors.teal,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: isDarkModeNotifier,
      builder: (context, isDarkMode, child) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: _buildThemeData(isDarkMode),
          home: Scaffold(
            body: Center(
              child: Text('Usage Summary: \$_apiData'),
            ),
          ),
          routes: {
            '/login': (context) => const LoginPage(title: 'Login'),
            '/signup': (context) => const SignUpPage(),
            '/home': (context) => const MainScaffold(),
            '/welcome': (context) => const WelcomePage(),
            '/notes': (context) => NotesPage(),
            '/onboarding': (context) => const OnboardingPage(),
          },
        );
      },
    );
  }
}
