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
    return animationView;
  }

  @objc func play(animationView: LottieAnimationView) {
    animationView.play(
      completion: { (success) in
        react_native_lottie_splash_screen.RNSplashScreen.setAnimationFinished(true)
      }
    );
  }
}
