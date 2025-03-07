/**
 * @link https://github.com/Arunjoseph3007/fontsa/tree/main
 */

/**
 */
class BinaryFileReader {
  file: string;
  buf: Uint8Array;
  index: number;

  constructor(file: string) {
    this.file = file;
    // @ts-ignore
    this.buf = new Uint8Array(require("fs").readFileSync(file));
    this.index = 0;
  }

  goto(index: number): void {
    this.index = index;
  }

  skip(skipBytes: number): void {
    this.index += skipBytes;
  }

  getBytes(noOfBytes: number): Uint8Array {
    return this.buf.slice(this.index, this.index + noOfBytes);
  }

  parseTag(): string {
    const data = new TextDecoder().decode(this.getBytes(4));
    this.index += 4;
    return data;
  }

  parseUint32(): number {
    const data = new DataView(this.buf.buffer, this.buf.byteOffset).getUint32(
      this.index,
      false
    );
    this.index += 4;
    return data;
  }

  parseUint16(): number {
    const data = new DataView(this.buf.buffer, this.buf.byteOffset).getUint16(
      this.index,
      false
    );
    this.index += 2;
    return data;
  }

  parseUint8(): number {
    const data = new DataView(this.buf.buffer, this.buf.byteOffset).getUint8(
      this.index
    );
    this.index += 1;
    return data;
  }

  parseInt8(): number {
    const data = new DataView(this.buf.buffer, this.buf.byteOffset).getInt8(
      this.index
    );
    this.index += 1;
    return data;
  }

  parseInt16(): number {
    const data = new DataView(this.buf.buffer, this.buf.byteOffset).getInt16(
      this.index,
      false
    );
    this.index += 2;
    return data;
  }

  parseLongDateTime(): number {
    const data = new DataView(this.buf.buffer, this.buf.byteOffset).getBigInt64(
      this.index,
      false
    );
    this.index += 8;
    return Number(data);
  }

  takeBytes(length: number): Uint8Array {
    const data = this.getBytes(length);
    this.index += length;
    return data;
  }
}

class SimpleGlyph {
  isCompound: boolean;
  numberOfContours: number;
  endPtsOfContours: number[];
  flags: Uint8Array[];
  points: [number, number][];

  constructor(
    numberOfContours: number,
    endPtsOfContours: number[],
    flags: Uint8Array[],
    points: [number, number][]
  ) {
    this.isCompound = false;
    this.numberOfContours = numberOfContours;
    this.endPtsOfContours = endPtsOfContours;
    this.flags = flags;
    this.points = points;
  }

  static fromReader(
    reader: BinaryFileReader,
    numberOfContours: number
  ): SimpleGlyph {
    reader.parseInt16(); // xMin
    reader.parseInt16(); // yMin
    reader.parseInt16(); // xMax
    reader.parseInt16(); // yMax

    const endPtsOfContours = Array.from({ length: numberOfContours }, () =>
      reader.parseUint16()
    );
    const numberOfPoints = endPtsOfContours[endPtsOfContours.length - 1] + 1;
    const instructionLength = reader.parseUint16();
    reader.skip(instructionLength);

    const flags: Uint8Array[] = [];
    while (flags.length < numberOfPoints) {
      const flag = reader.takeBytes(1);
      flags.push(flag);
      if (flag[0] & 0x08) {
        // Repeat flag
        const repeatCount = reader.parseUint8();
        for (let i = 0; i < repeatCount; i++) {
          flags.push(flag);
        }
      }
    }

    const xCoords: number[] = [];
    let xAcc = 0;
    for (const flag of flags) {
      let xOffset = 0;
      if (flag[0] & 0x02) {
        xOffset = reader.parseUint8();
        if (!(flag[0] & 0x10)) {
          xOffset = -xOffset;
        }
      } else if (!(flag[0] & 0x10)) {
        xOffset = reader.parseInt16();
      }
      xAcc += xOffset;
      xCoords.push(xAcc);
    }

    const yCoords: number[] = [];
    let yAcc = 0;
    for (const flag of flags) {
      let yOffset = 0;
      if (flag[0] & 0x04) {
        yOffset = reader.parseUint8();
        if (!(flag[0] & 0x20)) {
          yOffset = -yOffset;
        }
      } else if (!(flag[0] & 0x20)) {
        yOffset = reader.parseInt16();
      }
      yAcc += yOffset;
      yCoords.push(yAcc);
    }

    const points: [number, number][] = xCoords.map((x, i) => [x, yCoords[i]]);

    return new SimpleGlyph(numberOfContours, endPtsOfContours, flags, points);
  }

  transform(scaleX: number, scaleY: number, offsetX: number, offsetY: number) {
    this.points = this.points.map((p) => [
      scaleX * p[0] + offsetX,
      scaleY * p[1] + offsetY,
    ]);
  }
}

class TableRecord {
  constructor(
    public tag: string,
    public checksum: number,
    public offset: number,
    public length: number
  ) {}
}

class EncodingRecord {
  constructor(
    public platformID: number,
    public encodingID: number,
    public offset: number
  ) {}
}

class HeadTable {
  constructor(
    public majorVersion: number,
    public minorVersion: number,
    public fontRevision: number,
    public checksumAdjustment: number,
    public magicNumber: number,
    public flags: number,
    public unitsPerEm: number,
    public created: number,
    public modified: number,
    public xMin: number,
    public yMin: number,
    public xMax: number,
    public yMax: number,
    public macStyle: number,
    public lowestRecPPEM: number,
    public fontDirectionHint: number,
    public indexToLocFormat: number,
    public glyphDataFormat: number
  ) {}
}

class MaxpTable {
  constructor(
    public version: number,
    public numGlyphs: number,
    public maxPoints: number,
    public maxContours: number,
    public maxCompositePoints: number,
    public maxCompositeContours: number,
    public maxZones: number,
    public maxTwilightPoints: number,
    public maxStorage: number,
    public maxFunctionDefs: number,
    public maxInstructionDefs: number,
    public maxStackElements: number,
    public maxSizeOfInstructions: number,
    public maxComponentElements: number,
    public maxComponentDepth: number
  ) {}
}

class CmapTable {
  startCodes: number[] = [];
  endCodes: number[] = [];
  idDeltas: number[] = [];
  idRangeOffsets: number[] = [];
  glyphIndexMap: Record<number, number> = {};
  segCount: number;

  constructor(reader: BinaryFileReader) {
    reader.parseUint16(); // version
    const numberSubtables = reader.parseUint16();
    const encodingRecords: EncodingRecord[] = [];

    for (let i = 0; i < numberSubtables; i++) {
      encodingRecords.push(
        new EncodingRecord(
          reader.parseUint16(),
          reader.parseUint16(),
          reader.parseUint32()
        )
      );
    }

    reader.parseUint16(); // format
    reader.parseUint16(); // length
    reader.parseUint16(); // language
    this.segCount = reader.parseUint16() / 2;
    reader.parseUint16(); // searchRange
    reader.parseUint16(); // entrySelector
    reader.parseUint16(); // rangeShift

    for (let i = 0; i < this.segCount; i++) {
      this.endCodes.push(reader.parseUint16());
    }
    reader.parseUint16(); // reservedPad
    for (let i = 0; i < this.segCount; i++) {
      this.startCodes.push(reader.parseUint16());
    }
    for (let i = 0; i < this.segCount; i++) {
      this.idDeltas.push(reader.parseInt16());
    }

    const idRangeOffsetsStart = reader.index;
    for (let i = 0; i < this.segCount; i++) {
      this.idRangeOffsets.push(reader.parseUint16());
    }

    for (let i = 1; i < this.segCount; i++) {
      let glyphIndex = 0;
      for (let c = this.startCodes[i]; c < this.endCodes[i]; c++) {
        if (this.idRangeOffsets[i] !== 0) {
          const startCodeOffset = (c - this.startCodes[i]) * 2;
          const currentRangeOffset = i * 2;
          const glyphIndexOffset =
            idRangeOffsetsStart +
            currentRangeOffset +
            this.idRangeOffsets[i] +
            startCodeOffset;

          reader.goto(glyphIndexOffset);
          glyphIndex = reader.parseUint16();
          if (glyphIndex !== 0) {
            glyphIndex = (glyphIndex + this.idDeltas[i]) & 0xffff;
          }
        } else {
          glyphIndex = (c + this.idDeltas[i]) & 0xffff;
        }
        this.glyphIndexMap[c] = glyphIndex;
      }
    }
  }

  getGlyphId(charCode: number): number {
    return this.glyphIndexMap[charCode];
  }
}

class HmtxTable {
  hMetrics: [number, number][];
  leftSideBearings: number[];

  constructor(hMetrics: [number, number][], leftSideBearings: number[]) {
    this.hMetrics = hMetrics;
    this.leftSideBearings = leftSideBearings;
  }

  getMetric(idx: number): [number, number] {
    if (idx < this.hMetrics.length) {
      return this.hMetrics[idx];
    } else {
      return [
        this.hMetrics[this.hMetrics.length - 1][0],
        this.leftSideBearings[idx - this.hMetrics.length],
      ];
    }
  }
}

export class Font {
  fontDirectory: Record<string, TableRecord> = {};
  cmapTable!: CmapTable;
  maxpTable!: MaxpTable;
  headTable!: HeadTable;
  hmtxTable!: HmtxTable;
  locaTable: number[] = [];
  glyphs: SimpleGlyph[] = [];

  constructor(file: string) {
    const reader = new BinaryFileReader(file);

    this.parseFontDirectory(reader);
    this.parseHeadTable(reader);
    this.parseMaxpTable(reader);
    this.parseCmapTable(reader);
    this.parseLocaTable(reader);
    this.parseGlyphTable(reader);
    this.parseHmtxTable(reader);
  }

  parseFontDirectory(reader: BinaryFileReader): void {
    reader.parseUint32(); // sfntVersion
    const numTables = reader.parseUint16();
    reader.parseUint16(); // searchRange
    reader.parseUint16(); // entrySelector
    reader.parseUint16(); // rangeShift

    for (let i = 0; i < numTables; i++) {
      const tag = reader.parseTag();
      const checksum = reader.parseUint32();
      const offset = reader.parseUint32();
      const length = reader.parseUint32();

      this.fontDirectory[tag] = { tag, checksum, offset, length };
    }
  }

  gotoTable(tableName: string, reader: BinaryFileReader): TableRecord {
    const tableRecord = this.fontDirectory[tableName];
    if (!tableRecord) throw new Error(`${tableName} Table not found`);
    reader.goto(tableRecord.offset);
    return tableRecord;
  }

  parseCmapTable(reader: BinaryFileReader): void {
    this.gotoTable("cmap", reader);
    this.cmapTable = new CmapTable(reader);
  }

  parseMaxpTable(reader: BinaryFileReader): void {
    this.gotoTable("maxp", reader);
    this.maxpTable = new MaxpTable(
      reader.parseUint32(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint16()
    );
  }

  parseHeadTable(reader: BinaryFileReader): void {
    this.gotoTable("head", reader);
    this.headTable = new HeadTable(
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseUint32(),
      reader.parseUint32(),
      reader.parseUint32(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseLongDateTime(),
      reader.parseLongDateTime(),
      reader.parseInt16(),
      reader.parseInt16(),
      reader.parseInt16(),
      reader.parseInt16(),
      reader.parseUint16(),
      reader.parseUint16(),
      reader.parseInt16(),
      reader.parseInt16(),
      reader.parseInt16()
    );
  }

  parseLocaTable(reader: BinaryFileReader): void {
    this.gotoTable("loca", reader);
    const isShort = this.headTable.indexToLocFormat === 0;

    for (let i = 0; i < this.maxpTable.numGlyphs; i++) {
      this.locaTable.push(
        isShort ? reader.parseUint16() * 2 : reader.parseUint32()
      );
    }
    reader.parseUint16(); // Read endAddress
  }

  parseGlyphTable(reader: BinaryFileReader): void {
    const glyfTableRecord = this.gotoTable("glyf", reader);

    for (const offset of this.locaTable) {
      const glyphLoc = glyfTableRecord.offset + offset;
      const glyph = this.parseGlyph(reader, glyphLoc);
      this.glyphs.push(glyph);
    }
  }

  parseGlyph(reader: BinaryFileReader, loc: number): SimpleGlyph {
    reader.goto(loc);
    const numContours = reader.parseInt16();
    return numContours >= 0
      ? SimpleGlyph.fromReader(reader, numContours)
      : this.parseCompoundGlyph(reader);
  }

  parseCompoundGlyph(reader: BinaryFileReader): SimpleGlyph {
    const compGlyph = new SimpleGlyph(0, [], [], []);
    reader.parseInt16(); // xMin
    reader.parseInt16(); // yMin
    reader.parseInt16(); // xMax
    reader.parseInt16(); // yMax

    let hasMoreComponents = 1;
    while (hasMoreComponents) {
      const flags = reader.parseUint16();
      const glyphIndex = reader.parseUint16();
      hasMoreComponents = flags & (1 << 5);

      const scaleX = 1.0,
        scaleY = 1.0;
      let offsetX = 0.0,
        offsetY = 0.0;

      if (flags & (1 << 1)) {
        offsetX = flags & 1 ? reader.parseInt16() : reader.parseInt8();
        offsetY = flags & 1 ? reader.parseInt16() : reader.parseInt8();
      }

      const compLoc =
        this.fontDirectory["glyf"].offset + this.locaTable[glyphIndex];
      const glyphComponent = this.parseGlyph(reader, compLoc);
      glyphComponent.transform(scaleX, scaleY, offsetX, offsetY);

      compGlyph.numberOfContours += glyphComponent.numberOfContours;
      compGlyph.flags.push(...glyphComponent.flags);
      compGlyph.points.push(...glyphComponent.points);
      compGlyph.endPtsOfContours.push(...glyphComponent.endPtsOfContours);
    }
    return compGlyph;
  }

  parseHmtxTable(reader: BinaryFileReader): void {
    this.gotoTable("hhea", reader);
    reader.skip(34);
    const numOfLongHorMetrics = reader.parseUint16();
    this.gotoTable("hmtx", reader);

    const hMetrics: [number, number][] = [],
      leftSideBearings: number[] = [];
    for (let i = 0; i < numOfLongHorMetrics; i++) {
      hMetrics.push([reader.parseUint16(), reader.parseInt16()]);
    }
    for (let i = 0; i < this.maxpTable.numGlyphs - numOfLongHorMetrics; i++) {
      leftSideBearings.push(reader.parseUint16());
    }
    this.hmtxTable = new HmtxTable(hMetrics, leftSideBearings);
  }
}
