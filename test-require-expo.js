try {
    const { getDefaultConfig } = require("expo/metro-config");
    console.log("Successfully required expo/metro-config");
    const config = getDefaultConfig(__dirname);
    console.log("Successfully got default config");
} catch (error) {
    console.error("Failed:", error);
}
