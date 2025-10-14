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

    // Setup simple fade animation
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SizedBox(
            width: double.infinity,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Top spacer for lots of whitespace
                const Spacer(flex: 3),

                // Logo centered with ample space
                Image.asset(
                  'assets/images/logo.png',
                  width: 100,
                  height: 100,
                ),
                const SizedBox(height: 24),

                // App name - corporate font style
                Text(
                  'PlasticMart',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).textTheme.headlineMedium?.color ?? Colors.black87,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),

                // Tagline - subtle and professional
                Text(
                  l10n.splash_tagline,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6) ?? Colors.grey.shade500,
                    letterSpacing: 0.2,
                  ),
                ),

                // Bottom spacer for lots of whitespace
                const Spacer(flex: 3),

                // Minimal loading indicator
                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.4) ?? Colors.grey.shade400,
                    ),
                    strokeWidth: 2,
                  ),
                ),
                const SizedBox(height: 48),

                // Version at bottom - very subtle
                Text(
                  l10n.splash_version,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w400,
                    color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.3) ?? Colors.grey.shade300,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
