module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel"
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": "."
          },
          extensions: [".tsx", ".ts", ".jsx", ".js", ".json"]
        }
      ],
      // Reanimated plugin must be listed last
      "react-native-reanimated/plugin"
    ]
  }
}
