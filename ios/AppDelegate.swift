#if canImport(UIKit)
import UIKit
import AVFoundation
import Expo
import React
import RCTLinking
import React_RCTAppDelegate
import ReactAppDependencyProvider

// Third party plugins
import react_native_lottie_splash_screen
import Firebase
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: ExpoAppDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?
  private var splashPlayer: AVPlayer?
  private var splashPlayerLayer: AVPlayerLayer?
  private var splashDidEndObserver: NSObjectProtocol?
  private var splashFailedObserver: NSObjectProtocol?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: ExpoReactNativeFactory?

  override func application(
      _ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
      _ = super.application(application, didFinishLaunchingWithOptions: launchOptions)

      FirebaseApp.configure()
      UNUserNotificationCenter.current().delegate = self
      application.registerForRemoteNotifications()

      // Initialize React Native components
      let delegate = ReactNativeDelegate()
      let factory = ExpoReactNativeFactory(delegate: delegate)
      delegate.dependencyProvider = RCTAppDependencyProvider()

      reactNativeDelegate = delegate
      reactNativeFactory = factory
      bindReactNativeFactory(factory)

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
        let splashBackgroundColor = UIColor(
          red: 246.0 / 255.0,
          green: 246.0 / 255.0,
          blue: 247.0 / 255.0,
          alpha: 1.0
        )
        rootView.backgroundColor = splashBackgroundColor

        let splashContainer = UIView(frame: rootView.bounds)
        splashContainer.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        splashContainer.backgroundColor = splashBackgroundColor

        react_native_lottie_splash_screen.RNSplashScreen.showLottieSplash(
          splashContainer,
          inRootView: rootView
        )
        react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(false)

        if let splashUrl = Bundle.main.url(forResource: "splash", withExtension: "mp4") {
          let playerItem = AVPlayerItem(url: splashUrl)
          let player = AVPlayer(playerItem: playerItem)
          player.isMuted = true
          player.actionAtItemEnd = .pause

          let playerLayer = AVPlayerLayer(player: player)
          playerLayer.videoGravity = .resizeAspectFill
          playerLayer.frame = splashContainer.bounds
          splashContainer.layer.addSublayer(playerLayer)

          splashPlayer = player
          splashPlayerLayer = playerLayer
          splashDidEndObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: playerItem,
            queue: .main
          ) { [weak self] _ in
            react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
            self?.cleanupSplashVideoPlayer()
          }
          splashFailedObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemFailedToPlayToEndTime,
            object: playerItem,
            queue: .main
          ) { [weak self] _ in
            react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
            self?.cleanupSplashVideoPlayer()
          }

          player.play()
        } else {
          react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
        }
      }

      return true
    }

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
    Messaging.messaging().apnsToken = deviceToken
    NSLog("[Push][iOS] Registered for remote notifications; APNs token assigned.")
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
    NSLog("[Push][iOS] Failed to register for remote notifications: \(error.localizedDescription)")
  }

  override func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    super.application(
      application,
      didReceiveRemoteNotification: userInfo,
      fetchCompletionHandler: completionHandler
    )
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    IOSNotificationsFeedBridge.emitRemoteNotificationRequest(notification.request)

    if #available(iOS 14.0, *) {
      completionHandler([.banner, .sound, .badge, .list])
      return
    }
    completionHandler([.alert, .sound, .badge])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    IOSNotificationsFeedBridge.emitRemoteNotificationRequest(response.notification.request)
    completionHandler()
  }

  private func cleanupSplashVideoPlayer() {
      if let observer = splashDidEndObserver {
          NotificationCenter.default.removeObserver(observer)
          splashDidEndObserver = nil
      }
      if let observer = splashFailedObserver {
          NotificationCenter.default.removeObserver(observer)
          splashFailedObserver = nil
      }
      splashPlayerLayer?.removeFromSuperlayer()
      splashPlayerLayer = nil
      splashPlayer = nil
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

  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    let expoHandled = super.application(app, open: url, options: options)
    let reactNativeHandled = RCTLinkingManager.application(app, open: url, options: options)
    return expoHandled || reactNativeHandled
  }

  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    let expoHandled = super.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
    let reactNativeHandled = RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
    return expoHandled || reactNativeHandled
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
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
#endif
