import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../home_screen.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // Setup fade animation
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _animationController.forward();

    // Navigate after delay
    _navigateToNextScreen();
  }

  Future<void> _navigateToNextScreen() async {
    // Wait for 2.5 seconds to show splash screen
    await Future.delayed(const Duration(milliseconds: 2500));

    if (!mounted) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    // Navigate based on authentication state
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => authProvider.isAuthenticated
            ? const HomeScreen()
            : const LoginScreen(),
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFFC5E5DC),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // App Logo
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 80,
                  height: 80,
                ),
              ),
              const SizedBox(height: 32),

              // App Name
              const Text(
                'PlasticMart',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),

              // Tagline
              Text(
                l10n.splash_tagline,
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.black54,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 48),

              // Loading Indicator
              const SizedBox(
                width: 40,
                height: 40,
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.black87),
                  strokeWidth: 3,
                ),
              ),
              const SizedBox(height: 24),

              // Version Number
              Text(
                l10n.splash_version,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.black38,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
