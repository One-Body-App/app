#if canImport(UIKit)
import UIKit
import Foundation
import Lottie
import react_native_lottie_splash_screen

@objc class Dynamic: NSObject {

  @objc func createAnimationView(rootView: UIView, lottieName: String) -> LottieAnimationView {
    let animationView = LottieAnimationView(name: lottieName)
    animationView.frame = rootView.frame
    animationView.center = rootView.center
    animationView.backgroundColor = UIColor.white;
    
    animationView.frame = rootView.bounds
    animationView.loopMode = .playOnce
    animationView.animationSpeed = 1.0
    return animationView;
  }

//  @objc func play(animationView: LottieAnimationView) {
//    animationView.play(
//      completion: { (success) in
//        react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
//      }
//    );
//  }
  @objc func play(animationView: LottieAnimationView, completion: LottieCompletionBlock? = nil) {
          animationView.play(completion: completion) // Pass the completion to Lottie's play method
      }
}
#endif
