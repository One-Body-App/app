import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import React_RCTLinking
import Expo

import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: ExpoReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Allow haptics during audio session (e.g. camera recording)
    try? AVAudioSession.sharedInstance().setAllowHapticsAndSystemSoundsDuringRecording(true)

    // CRITICAL: Check if app was launched via universal link
    if let userActivity = launchOptions?[.userActivityDictionary] as? [AnyHashable: Any],
       let activity = userActivity["UIApplicationLaunchOptionsUserActivityKey"] as? NSUserActivity,
       activity.activityType == NSUserActivityTypeBrowsingWeb,
       let url = activity.webpageURL {
      print("[iOS Deep Link] App LAUNCHED with universal link: \(url.absoluteString)")
    }

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    AppDelegatesLoaderDelegate.registerAppDelegateSubscribers(self)
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
    print("[iOS Deep Link] application:continue:restorationHandler CALLED")
    print("[iOS Deep Link] Activity type: \(userActivity.activityType)")
    print("[iOS Deep Link] App state: \(application.applicationState.rawValue)") // 0=active, 1=inactive, 2=background

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

        // Check for Firebase Dynamic Link format
        if let linkParam = queryItems.first(where: { $0.name == "link" })?.value {
          print("[iOS Deep Link] Firebase Dynamic Link wrapper detected, nested link: \(linkParam)")
        }
      }

      // RCTLinkingManager will handle passing this to React Native
      let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
      print("[iOS Deep Link] RCTLinkingManager returned: \(result)")
      return result
    }
    print("[iOS Deep Link] Not a web browsing activity, returning false")
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
