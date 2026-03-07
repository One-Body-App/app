#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "AsymmetricKeyType.hpp"
#import "CipherArgs.hpp"
#import "CipherInfo.hpp"
#import "HybridArgon2Spec.hpp"
#import "HybridBlake3Spec.hpp"
#import "HybridCertificateSpec.hpp"
#import "HybridCipherFactorySpec.hpp"
#import "HybridCipherSpec.hpp"
#import "HybridDhKeyPairSpec.hpp"
#import "HybridDiffieHellmanSpec.hpp"
#import "HybridDsaKeyPairSpec.hpp"
#import "HybridECDHSpec.hpp"
#import "HybridEcKeyPairSpec.hpp"
#import "HybridEdKeyPairSpec.hpp"
#import "HybridHashSpec.hpp"
#import "HybridHkdfSpec.hpp"
#import "HybridHmacSpec.hpp"
#import "HybridKeyObjectHandleSpec.hpp"
#import "HybridKmacSpec.hpp"
#import "HybridMlDsaKeyPairSpec.hpp"
#import "HybridMlKemKeyPairSpec.hpp"
#import "HybridPbkdf2Spec.hpp"
#import "HybridPrimeSpec.hpp"
#import "HybridRandomSpec.hpp"
#import "HybridRsaCipherSpec.hpp"
#import "HybridRsaKeyPairSpec.hpp"
#import "HybridScryptSpec.hpp"
#import "HybridSignHandleSpec.hpp"
#import "HybridUtilsSpec.hpp"
#import "HybridVerifyHandleSpec.hpp"
#import "HybridX509CertificateHandleSpec.hpp"
#import "JWK.hpp"
#import "JWKkty.hpp"
#import "JWKuse.hpp"
#import "KeyDetail.hpp"
#import "KeyEncoding.hpp"
#import "KeyObject.hpp"
#import "KeyType.hpp"
#import "KeyUsage.hpp"
#import "KFormatType.hpp"
#import "NamedCurve.hpp"
#import "QuickCrypto-Swift-Cxx-Bridge.hpp"

FOUNDATION_EXPORT double QuickCryptoVersionNumber;
FOUNDATION_EXPORT const unsigned char QuickCryptoVersionString[];

