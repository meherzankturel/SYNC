// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Features",
    platforms: [.iOS(.v16)],
    products: [
        .library(name: "Features", targets: ["Auth", "Mood", "DateNight"]),
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(path: "../DesignSystem"),
    ],
    targets: [
        .target(
            name: "Auth",
            dependencies: ["Core", "DesignSystem", "Mood", "DateNight"] // Auth might need nav to others? Or others need Auth? Usually separate.
            // Circular deps are bad. Usually App coordinates.
            // Let's keep them independent for now.
        ),
        .target(
            name: "Mood",
            dependencies: ["Core", "DesignSystem"]
        ),
         .target(
            name: "DateNight",
            dependencies: ["Core", "DesignSystem"]
        ),
    ]
)
