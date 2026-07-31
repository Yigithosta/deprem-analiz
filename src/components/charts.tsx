import React, { useState } from "react";
import { View } from "react-native";
import Svg, {
  Path,
  Rect,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Text as SvgText,
} from "react-native-svg";
import { C, alpha, MONO } from "../theme/tokens";
import { Txt, Row } from "./ui";

/**
 * recharts yerine react-native-svg ile yazılmış hafif grafikler.
 * (recharts yalnızca DOM üzerinde çalıştığı için React Native'de kullanılamaz.)
 */

type Series = { key: string; label: string; color: string };

const PAD = { top: 10, right: 8, bottom: 20, left: 28 };

function niceMax(v: number) {
  const step = v > 200 ? 50 : v > 100 ? 25 : v > 40 ? 20 : 10;
  return Math.ceil(v / step) * step;
}

export function AreaChart({
  data,
  series,
  xKey = "day",
  height = 180,
}: {
  data: any[];
  series: Series[];
  xKey?: string;
  height?: number;
}) {
  const [w, setW] = useState(320);
  const max = niceMax(Math.max(...data.flatMap((d) => series.map((s) => d[s.key]))));
  const iw = Math.max(1, w - PAD.left - PAD.right);
  const ih = Math.max(1, height - PAD.top - PAD.bottom);

  const px = (i: number) => PAD.left + (i / Math.max(1, data.length - 1)) * iw;
  const py = (v: number) => PAD.top + ih - (v / max) * ih;

  const gridVals = [0, max / 2, max];

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width="100%" height={height}>
        <Defs>
          {series.map((s) => (
            <LinearGradient key={s.key} id={`ag-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={s.color} stopOpacity={0.42} />
              <Stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </LinearGradient>
          ))}
        </Defs>

        {gridVals.map((v) => (
          <React.Fragment key={v}>
            <Line x1={PAD.left} y1={py(v)} x2={w - PAD.right} y2={py(v)} stroke={C.border} strokeWidth={0.6} />
            <SvgText x={PAD.left - 5} y={py(v) + 3} fontSize={9} fill={C.muted} textAnchor="end" fontFamily={MONO}>
              {v}
            </SvgText>
          </React.Fragment>
        ))}

        {series.map((s) => {
          const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${px(i)},${py(d[s.key])}`).join(" ");
          const area = `${line} L ${px(data.length - 1)},${py(0)} L ${px(0)},${py(0)} Z`;
          return (
            <React.Fragment key={s.key}>
              <Path d={area} fill={`url(#ag-${s.key})`} />
              <Path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {data.map((d, i) => (
                <Circle key={i} cx={px(i)} cy={py(d[s.key])} r={2.2} fill={s.color} />
              ))}
            </React.Fragment>
          );
        })}

        {data.map((d, i) => (
          <SvgText
            key={i}
            x={px(i)}
            y={height - 5}
            fontSize={9}
            fill={C.muted}
            textAnchor="middle"
            fontFamily={MONO}
          >
            {d[xKey]}
          </SvgText>
        ))}
      </Svg>
      <Legend series={series} />
    </View>
  );
}

export function BarChart({
  data,
  series,
  xKey = "day",
  height = 180,
}: {
  data: any[];
  series: Series;
  xKey?: string;
  height?: number;
}) {
  const [w, setW] = useState(320);
  const max = niceMax(Math.max(...data.map((d) => d[series.key])));
  const iw = Math.max(1, w - PAD.left - PAD.right);
  const ih = Math.max(1, height - PAD.top - PAD.bottom);
  const slot = iw / data.length;
  const bw = Math.max(4, slot * 0.55);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width="100%" height={height}>
        {[0, max / 2, max].map((v) => {
          const y = PAD.top + ih - (v / max) * ih;
          return (
            <React.Fragment key={v}>
              <Line x1={PAD.left} y1={y} x2={w - PAD.right} y2={y} stroke={C.border} strokeWidth={0.6} />
              <SvgText x={PAD.left - 5} y={y + 3} fontSize={9} fill={C.muted} textAnchor="end" fontFamily={MONO}>
                {v}
              </SvgText>
            </React.Fragment>
          );
        })}
        {data.map((d, i) => {
          const bh = (d[series.key] / max) * ih;
          const x = PAD.left + i * slot + (slot - bw) / 2;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={PAD.top + ih - bh} width={bw} height={bh} rx={3} fill={series.color} opacity={0.9} />
              <SvgText
                x={PAD.left + i * slot + slot / 2}
                y={height - 5}
                fontSize={9}
                fill={C.muted}
                textAnchor="middle"
                fontFamily={MONO}
              >
                {d[xKey]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      <Legend series={[series]} />
    </View>
  );
}

function Legend({ series }: { series: Series[] }) {
  return (
    <Row gap={12} wrap style={{ marginTop: 6, paddingLeft: PAD.left }}>
      {series.map((s) => (
        <Row key={s.key} gap={5}>
          <View style={{ width: 9, height: 3, borderRadius: 2, backgroundColor: s.color }} />
          <Txt size={10} color={C.muted}>
            {s.label}
          </Txt>
        </Row>
      ))}
    </Row>
  );
}

/** Yatay çubuk listesi — kompakt karşılaştırmalar için. */
export function HBar({
  label,
  pct,
  color,
  right,
  labelWidth = 90,
}: {
  label: string;
  pct: number;
  color: string;
  right?: string;
  labelWidth?: number;
}) {
  return (
    <Row gap={8} style={{ marginBottom: 8 }}>
      <Txt size={11} color={C.txt2} numberOfLines={1} style={{ width: labelWidth }}>
        {label}
      </Txt>
      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.border, overflow: "hidden" }}>
        <View style={{ width: `${Math.min(100, pct)}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} />
      </View>
      <Txt size={10} weight="700" color={color} mono style={{ width: 44, textAlign: "right" }}>
        {right ?? `%${pct}`}
      </Txt>
    </Row>
  );
}

/** Halka gösterge — tek bir oranı vurgulamak için. */
export function Donut({
  pct,
  color,
  size = 64,
  label,
}: {
  pct: number;
  color: string;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const fill = (Math.min(pct, 100) / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={alpha(color, 0.18)} strokeWidth={5} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={5}
          fill="none"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Txt size={13} weight="700" color={color} mono>
        %{pct}
      </Txt>
      {!!label && (
        <Txt size={8} color={C.muted} upper>
          {label}
        </Txt>
      )}
    </View>
  );
}
