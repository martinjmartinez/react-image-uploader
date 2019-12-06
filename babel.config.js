module.exports = function (api) {
    api.cache(true);

    const presets = [
        'module:metro-react-native-babel-preset',
        'module:react-native-dotenv'
    ];
    const plugins = [ ];

    return {
        presets,
        plugins
    };
}