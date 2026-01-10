import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import React_RCTLinking

import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Allow haptics during audio session (e.g. camera recording)
    try? AVAudioSession.sharedInstance().setAllowHapticsAndSystemSoundsDuringRecording(true)

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "RnDiffApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - Universal Links Support
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    // Handle Universal Links for email verification
    if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
       let url = userActivity.webpageURL {
      print("[iOS Deep Link] Universal Link received: \(url.absoluteString)")

      // Extract query parameters for logging
      if let components = URLComponents(url: url, resolvingAgainstBaseURL: true) {
        let queryItems = components.queryItems ?? []
        print("[iOS Deep Link] Path: \(components.path)")
        print("[iOS Deep Link] Query params count: \(queryItems.count)")

        // Log if this is an email verification link
        if let mode = queryItems.first(where: { $0.name == "mode" })?.value,
           let oobCode = queryItems.first(where: { $0.name == "oobCode" })?.value {
          print("[iOS Deep Link] Email verification link detected - mode: \(mode), oobCode length: \(oobCode.count)")
        }
      }

      // RCTLinkingManager will handle passing this to React Native
      return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    return false
  }

  // MARK: - Custom URL Schemes Support
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    print("[iOS Deep Link] openURL:", url.absoluteString)
    return RCTLinkingManager.application(app, open: url, options: options)
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
