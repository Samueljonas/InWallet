import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export type IconName =
  | "home"
  | "transactions"
  | "settings"
  | "wallet"
  | "target"
  | "repeat"
  | "download"
  | "edit"
  | "trash"
  | "logout"
  | "plus"
  | "close"
  | "arrow-up"
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "search"
  | "check"
  | "lock"
  | "file"
  | "spark"
  | "upload"
  | "copy";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/**
 * Sistema de ícones geométricos minimalistas nativos (Linear / Wise style).
 * Zero emojis, traços finos de 1.75px que herdam a cor do tema.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 18,
  color = colors.text,
}) => {
  const stroke = 1.75;

  switch (name) {
    case "home": {
      const box = Math.floor((size - 5) / 2);
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View style={styles.gridRow}>
            <View
              style={{
                width: box,
                height: box,
                borderRadius: 2.5,
                borderWidth: stroke,
                borderColor: color,
              }}
            />
            <View
              style={{
                width: box,
                height: box,
                borderRadius: 2.5,
                borderWidth: stroke,
                borderColor: color,
              }}
            />
          </View>
          <View style={[styles.gridRow, { marginTop: 3 }]}>
            <View
              style={{
                width: box,
                height: box,
                borderRadius: 2.5,
                borderWidth: stroke,
                borderColor: color,
              }}
            />
            <View
              style={{
                width: box,
                height: box,
                borderRadius: 2.5,
                borderWidth: stroke,
                borderColor: color,
              }}
            />
          </View>
        </View>
      );
    }

    case "transactions": {
      return (
        <View
          style={[
            styles.wrap,
            { width: size, height: size, justifyContent: "space-between", paddingVertical: 2 },
          ]}
        >
          <View
            style={{
              width: size,
              height: stroke,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              width: size * 0.72,
              height: stroke,
              backgroundColor: color,
              borderRadius: 1,
              alignSelf: "flex-start",
            }}
          />
          <View
            style={{
              width: size * 0.88,
              height: stroke,
              backgroundColor: color,
              borderRadius: 1,
              alignSelf: "flex-start",
            }}
          />
        </View>
      );
    }

    case "settings": {
      return (
        <View
          style={[
            styles.wrap,
            { width: size, height: size, justifyContent: "space-between", paddingVertical: 2 },
          ]}
        >
          <View style={{ width: size, height: 4, justifyContent: "center" }}>
            <View style={{ width: size, height: stroke, backgroundColor: color, borderRadius: 1 }} />
            <View
              style={{
                position: "absolute",
                left: size * 0.2,
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          </View>
          <View style={{ width: size, height: 4, justifyContent: "center" }}>
            <View style={{ width: size, height: stroke, backgroundColor: color, borderRadius: 1 }} />
            <View
              style={{
                position: "absolute",
                right: size * 0.2,
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          </View>
          <View style={{ width: size, height: 4, justifyContent: "center" }}>
            <View style={{ width: size, height: stroke, backgroundColor: color, borderRadius: 1 }} />
            <View
              style={{
                position: "absolute",
                left: size * 0.45,
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );
    }

    case "wallet": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size,
              height: size * 0.78,
              borderRadius: 3.5,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: "100%",
                height: stroke,
                backgroundColor: color,
                marginTop: -size * 0.18,
              }}
            />
          </View>
        </View>
      );
    }

    case "target": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: stroke,
              borderColor: color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: size * 0.42,
                height: size * 0.42,
                borderRadius: size / 4,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );
    }

    case "repeat": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.9,
              height: size * 0.65,
              borderRadius: 4,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
      );
    }

    case "download": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: stroke,
              height: size * 0.55,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              width: size * 0.35,
              height: size * 0.35,
              borderBottomWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "45deg" }],
              marginTop: -size * 0.25,
            }}
          />
          <View
            style={{
              width: size * 0.85,
              height: stroke,
              backgroundColor: color,
              marginTop: 3,
              borderRadius: 1,
            }}
          />
        </View>
      );
    }

    case "edit": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.75,
              height: size * 0.28,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 1.5,
              transform: [{ rotate: "-45deg" }],
            }}
          />
        </View>
      );
    }

    case "trash": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.8,
              height: stroke,
              backgroundColor: color,
              marginBottom: 1.5,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              width: size * 0.64,
              height: size * 0.68,
              borderWidth: stroke,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 2.5,
              borderBottomRightRadius: 2.5,
            }}
          />
        </View>
      );
    }

    case "logout": {
      return (
        <View style={[styles.wrap, { width: size, height: size, flexDirection: "row" }]}>
          <View
            style={{
              width: size * 0.45,
              height: size * 0.82,
              borderLeftWidth: stroke,
              borderTopWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: 3,
              borderBottomLeftRadius: 3,
            }}
          />
          <View
            style={{
              width: size * 0.45,
              height: stroke,
              backgroundColor: color,
              marginLeft: -2,
            }}
          />
        </View>
      );
    }

    case "plus": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              position: "absolute",
              width: size * 0.78,
              height: stroke + 0.4,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: stroke + 0.4,
              height: size * 0.78,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );
    }

    case "close": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              position: "absolute",
              width: size * 0.8,
              height: stroke,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: size * 0.8,
              height: stroke,
              backgroundColor: color,
              transform: [{ rotate: "-45deg" }],
              borderRadius: 1,
            }}
          />
        </View>
      );
    }

    case "arrow-up": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.42,
              height: size * 0.42,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "45deg" }],
              marginBottom: -size * 0.25,
            }}
          />
          <View
            style={{
              width: stroke,
              height: size * 0.65,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );
    }

    case "arrow-down": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: stroke,
              height: size * 0.65,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              width: size * 0.42,
              height: size * 0.42,
              borderBottomWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "45deg" }],
              marginTop: -size * 0.25,
            }}
          />
        </View>
      );
    }

    case "arrow-left": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.45,
              height: size * 0.45,
              borderBottomWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "45deg" }],
              marginLeft: 2,
            }}
          />
        </View>
      );
    }

    case "arrow-right": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.45,
              height: size * 0.45,
              borderTopWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "45deg" }],
              marginRight: 2,
            }}
          />
        </View>
      );
    }

    case "search": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.68,
              height: size * 0.68,
              borderRadius: size,
              borderWidth: stroke,
              borderColor: color,
              marginTop: -2,
              marginLeft: -2,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: size * 0.32,
              height: stroke,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
              borderRadius: 1,
            }}
          />
        </View>
      );
    }

    case "check": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.58,
              height: size * 0.32,
              borderLeftWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "-45deg" }],
              marginTop: -2,
            }}
          />
        </View>
      );
    }

    case "lock": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.46,
              height: size * 0.34,
              borderTopLeftRadius: size,
              borderTopRightRadius: size,
              borderWidth: stroke,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
          <View
            style={{
              width: size * 0.74,
              height: size * 0.52,
              borderRadius: 2.5,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
      );
    }

    case "file": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.72,
              height: size * 0.88,
              borderRadius: 2.5,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: "center",
              paddingHorizontal: 3,
              gap: 2.5,
            }}
          >
            <View style={{ width: "100%", height: 1.3, backgroundColor: color }} />
            <View style={{ width: "70%", height: 1.3, backgroundColor: color }} />
          </View>
        </View>
      );
    }

    case "spark": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.56,
              height: size * 0.56,
              borderWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "45deg" }],
              borderRadius: 1.5,
            }}
          />
        </View>
      );
    }

    case "upload": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              width: size * 0.35,
              height: size * 0.35,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: "45deg" }],
              marginBottom: -size * 0.25,
            }}
          />
          <View
            style={{
              width: stroke,
              height: size * 0.55,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              width: size * 0.85,
              height: stroke,
              backgroundColor: color,
              marginTop: 3,
              borderRadius: 1,
            }}
          />
        </View>
      );
    }

    case "copy": {
      return (
        <View style={[styles.wrap, { width: size, height: size }]}>
          <View
            style={{
              position: "absolute",
              top: 1,
              left: 1,
              width: size * 0.62,
              height: size * 0.62,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 2,
              opacity: 0.55,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 1,
              right: 1,
              width: size * 0.65,
              height: size * 0.65,
              borderWidth: stroke,
              borderColor: color,
              backgroundColor: colors.surface,
              borderRadius: 2,
            }}
          />
        </View>
      );
    }
  }
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  gridRow: {
    flexDirection: "row",
    gap: 3,
  },
});

