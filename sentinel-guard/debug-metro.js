try {
  console.log("Attempting to require expo/metro-config...");
  require("expo/metro-config");
  console.log("Success: expo/metro-config");

  console.log("Attempting to require nativewind/metro...");
  require("nativewind/metro");
  console.log("Success: nativewind/metro");

  console.log("Attempting to require ./metro.config.js...");
  require("./metro.config.js");
  console.log("Success: ./metro.config.js loaded!");
} catch (error) {
  console.error("ERROR LOADING CONFIG:");
  console.error(error);
}
