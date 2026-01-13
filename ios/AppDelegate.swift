import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

// Third party plugins
import Lottie
import react_native_lottie_splash_screen
import Firebase

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
      _ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
      FirebaseApp.configure()

      // Initialize React Native components
      let delegate = ReactNativeDelegate()
      let factory = RCTReactNativeFactory(delegate: delegate)
      delegate.dependencyProvider = RCTAppDependencyProvider()

      reactNativeDelegate = delegate
      reactNativeFactory = factory

      window = UIWindow(frame: UIScreen.main.bounds)

      // Start React Native and set it as the window's root view controller
      factory.startReactNative(
        withModuleName: "onebody",
        in: window,
        launchOptions: launchOptions
      )

      // Ensure window is visible (important for the splash screen to appear)
      window?.makeKeyAndVisible()

      if let rootView = window?.rootViewController?.view {

        // Set the background color based on user interface style
        switch (UIScreen.main.traitCollection.userInterfaceStyle) {
        case .dark:
          rootView.backgroundColor = .black
        case .light, .unspecified: // Combine light and unspecified for white background
          rootView.backgroundColor = .white
        @unknown default: // Handles any future, unknown interface styles
          rootView.backgroundColor = .white
        }

        // MARK: - Lottie Splash Screen Setup
        let dynamic = Dynamic() // Assuming Dynamic class is defined elsewhere and handles Lottie setup

        // Attempt to create and show the Lottie animation view
        if let animationUIView = dynamic.createAnimationView(rootView: rootView, lottieName: "logoAnimation") as? UIView {
          
          // Show the Lottie splash screen using the react-native-lottie-splash-screen library
          // This will overlay the Lottie animation on top of your React Native root view.
          react_native_lottie_splash_screen.RNSplashScreen.showLottieSplash(animationUIView, inRootView: rootView)

          // If the created view is indeed a LottieAnimationView, play the animation.
          if let animationView = animationUIView as? LottieAnimationView {
            // Play the animation. The completion block here is for native logging/logic,
            // but DOES NOT hide the splash screen. Hiding is handled by JS.
            dynamic.play(animationView: animationView) { (finished) in
              if finished {
                print("Lottie animation finished playing on the native side.")
                // The splash screen will only disappear when SplashScreen.hide() is called from JS.
              }
            }
          } else {
            // Fallback if animationUIView is not a LottieAnimationView (shouldn't happen if createAnimationView is correct)
            print("Warning: Lottie animation view could not be cast to LottieAnimationView.")
            react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
          }
        } else {
          // Fallback if the animation view could not be created at all
          print("Error: Could not create Lottie animation view.")
          react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
        }
      }

      return true
    }
  
//  func application(
//    _ application: UIApplication,
//    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
//  ) -> Bool {
//    FirebaseApp.configure()
//    let delegate = ReactNativeDelegate()
//    let factory = RCTReactNativeFactory(delegate: delegate)
//    delegate.dependencyProvider = RCTAppDependencyProvider()
//
//    reactNativeDelegate = delegate
//    reactNativeFactory = factory
//
//    window = UIWindow(frame: UIScreen.main.bounds)
//
//    factory.startReactNative(
//      withModuleName: "onebody",
//      in: window,
//      launchOptions: launchOptions
//    )
//    
//
//    if let rootView = window?.rootViewController?.view {
//
//      switch (UIScreen.main.traitCollection.userInterfaceStyle) {
//      case .dark:
//          rootView.backgroundColor = .black
//      case .light, .unspecified:
//          rootView.backgroundColor = .white
//      @unknown default:
//          rootView.backgroundColor = .white
//      }
//
//      // Set up Lottie splash screen
//      let dynamic = Dynamic()
//      if let animationUIView = dynamic.createAnimationView(rootView: rootView, lottieName: "logoAnimation") as? UIView {
//                  react_native_lottie_splash_screen.RNSplashScreen.showLottieSplash(animationUIView, inRootView: rootView)
//
//                  if let animationView = animationUIView as? LottieAnimationView {
//                      // Play the animation and set setAnimationFinished(true) in the completion block
//                      dynamic.play(animationView: animationView) { (finished) in
//                          if finished {
//                              // This block will be executed once the Lottie animation is done playing
////                              react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
//                          }
//                      }
//                  } else {
//                      // If for some reason animationUIView isn't a LottieAnimationView,
//                      // ensure setAnimationFinished is still called to avoid infinite splash screen.
////                      react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
//                  }
//              } else {
//                  // If animationUIView couldn't be created, ensure setAnimationFinished is called.
////                  react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
//              }
////      if let animationUIView = dynamic.createAnimationView(rootView: rootView, lottieName: "logoAnimation") as? UIView {
////        react_native_lottie_splash_screen.RNSplashScreen.showLottieSplash(animationUIView, inRootView: rootView)
////
////        if let animationView = animationUIView as? LottieAnimationView {
////          dynamic.play(animationView: animationView)
////        }
////
////        // Force remove animation layout when hide is called
////        react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
////      }
//    }
//    return true
//  }

//  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
//      self.moduleName = "yourAwesomeApp"
//      self.dependencyProvider = RCTAppDependencyProvider()
//
//      // You can add your custom initial props in the dictionary below.
//      // They will be passed down to the ViewController used by React Native.
//      self.initialProps = [:]
//
//      let success = super.application(application, didFinishLaunchingWithOptions: launchOptions)
//
//      if success {
//        if let rootView = self.window.rootViewController?.view {
//          rootView.backgroundColor = .white
//
//          // Set up Lottie splash screen
//          let dynamic = Dynamic()
//          if let animationUIView = dynamic.createAnimationView(rootView: rootView, lottieName: "logo_animated") as? UIView {
//            react_native_lottie_splash_screen.RNSplashScreen.showLottieSplash(animationUIView, inRootView: rootView)
//
//            if let animationView = animationUIView as? LottieAnimationView {
//              dynamic.play(animationView: animationView)
//            }
//
//            // Force remove animation layout when hide is called
//            react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
//          }
//        }
//      }
//
//      return success
//    }

  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
