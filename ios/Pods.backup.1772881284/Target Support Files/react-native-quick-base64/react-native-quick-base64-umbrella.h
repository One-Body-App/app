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

#import "QuickBase64Module.h"
#import "../cpp/base64.h"
#import "../cpp/react-native-quick-base64.h"

FOUNDATION_EXPORT double react_native_quick_base64VersionNumber;
FOUNDATION_EXPORT const unsigned char react_native_quick_base64VersionString[];

