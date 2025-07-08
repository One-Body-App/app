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
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "onebody",
      in: window,
      launchOptions: launchOptions
    )

    if let rootView = window?.rootViewController?.view {
//      rootView.backgroundColor = .white

      // Set up Lottie splash screen
      let dynamic = Dynamic()
      if let animationUIView = dynamic.createAnimationView(rootView: rootView, lottieName: "logoAnimation") as? UIView {
        react_native_lottie_splash_screen.RNSplashScreen.showLottieSplash(animationUIView, inRootView: rootView)

        if let animationView = animationUIView as? LottieAnimationView {
          dynamic.play(animationView: animationView)
        }

        // Force remove animation layout when hide is called
        react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
      }
    }
    return true
  }

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
