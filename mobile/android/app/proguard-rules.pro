# Add project specific ProGuard rules here.
# See http://developer.android.com/guide/developing/tools/proguard.html
#
# R8 is gated by `enableProguardInReleaseBuilds` in build.gradle (currently false).
# These rules apply when R8 is enabled.

# Preserve source-file + line-number attributes so Play Console crash stack
# traces are readable. Cheap; high value; safe even with R8 off.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# React Native / Facebook annotations — anything marked @DoNotStrip must survive
# R8 because the JS bridge resolves these classes by reflection at runtime.
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers,allowobfuscation class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

# androidx.annotation.Keep (used by some third-party libs)
-keep,allowobfuscation @interface androidx.annotation.Keep
-keep @androidx.annotation.Keep class * { *; }

# Silence noisy okio / Conscrypt / animal-sniffer warnings pulled in transitively
# by Firebase + OkHttp; they are not present at runtime on Android.
-dontwarn okio.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn org.conscrypt.**
