#import "AppDelegate.h"
#import <Firebase.h>

#import <React/RCTBundleURLProvider.h>


#import <React/RCTLinkingManager.h>
#import <RNGoogleSignin/RNGoogleSignin.h>


#import <AuthenticationServices/AuthenticationServices.h>
#import <SafariServices/SafariServices.h>
#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>
#import "RNSplashScreen.h"
#import "Onebody-Swift.h"
#import "SDImageCodersManager.h"
#import <SDWebImageWebPCoder/SDImageWebPCoder.h>
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    self.moduleName = @"onebody";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  [FIRApp configure];




  [[FBSDKApplicationDelegate sharedInstance] application:application
                         didFinishLaunchingWithOptions:launchOptions];

  // Register WebP format support
  [SDImageCodersManager.sharedManager addCoder:SDImageWebPCoder.sharedCoder];
  BOOL success = [super application:application didFinishLaunchingWithOptions:launchOptions];
    // return [super application:application didFinishLaunchingWithOptions:launchOptions];

    // Following code was added for RN splash screen lottie
    if (success) {
      //This is where we will put the logic to get access to rootview
      UIView *rootView = self.window.rootViewController.view;


      [GMSServices provideAPIKey:@"AIzaSyDZmdm2o_TpqfQvWBWVgjWBFfIl1XdHTcs"]; // add this line using the api key obtained from Google Console

      Dynamic *t = [Dynamic new];
      UIView *animationUIView = (UIView *)[t createAnimationViewWithRootView:rootView lottieName:@"logoAnimation"]; // change lottieName to your lottie files name


            if (@available(iOS 12.0, *)) {
                    switch (UIScreen.mainScreen.traitCollection.userInterfaceStyle) {
                        case UIUserInterfaceStyleDark:
                        animationUIView.backgroundColor = [UIColor blackColor];
                            break;
                        case UIUserInterfaceStyleLight:
                        case UIUserInterfaceStyleUnspecified:
                        default:
                        animationUIView.backgroundColor = [UIColor whiteColor];
                            break;
                    }
            } else {
              animationUIView.backgroundColor = [UIColor whiteColor];
            }
      // register LottieSplashScreen to RNSplashScreen
      [RNSplashScreen showLottieSplash:animationUIView inRootView:rootView];
      // casting UIView type to AnimationView type
      LottieAnimationView *animationView = (LottieAnimationView *) animationUIView;
      // play
      [t playWithAnimationView:animationView];
      // If you want the animation layout to be forced to remove when hide is called, use this code
      [RNSplashScreen setAnimationFinished:true];
    }

    return success;


}

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = [NSMutableDictionary new];

#ifdef RCT_NEW_ARCH_ENABLED
  initProps[kRNConcurrentRoot] = @([self concurrentRootEnabled]);
#endif

  return initProps;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}
- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}


- (BOOL)application:(UIApplication *)application openURL:(nonnull NSURL *)url options:(nonnull NSDictionary<NSString *,id> *)options {

  // fix Firebase Dynamic Links
//    [[FIRDynamicLinks dynamicLinks] dynamicLinkFromCustomSchemeURL:url];

  return  [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options] || [RNGoogleSignin application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

@end
