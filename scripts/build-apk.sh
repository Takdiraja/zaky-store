#!/usr/bin/env bash
# Setup Android SDK + build debug APK untuk Warung Resoyudan (Capacitor)
set -e
export DEBIAN_FRONTEND=noninteractive

echo "== 1. Install JDK 17 =="
sudo apt-get update -qq
sudo apt-get install -y -qq openjdk-17-jdk unzip wget > /tmp/apk-build.log 2>&1
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

echo "== 2. Android cmdline-tools =="
SDK=$HOME/android-sdk
mkdir -p $SDK/cmdline-tools
cd /tmp
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdtools.zip
rm -rf $SDK/cmdline-tools/latest
mkdir -p $SDK/cmdline-tools/latest
unzip -q cmdtools.zip -d $SDK/cmdline-tools/latest
mv $SDK/cmdline-tools/latest/cmdline-tools/* $SDK/cmdline-tools/latest/ 2>/dev/null || true
export ANDROID_HOME=$SDK ANDROID_SDK_ROOT=$SDK
export PATH=$SDK/cmdline-tools/latest/bin:$SDK/platform-tools:$PATH
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" 2>&1 | tail -2

echo "== 3. Build APK =="
cd $HOME/workspace/warung-resoyudan-app/android
./gradlew assembleDebug --no-daemon 2>&1 | tail -5

echo "== SELESAI =="
find $HOME/workspace/warung-resoyudan-app/android/app/build/outputs/apk -name "*.apk"
