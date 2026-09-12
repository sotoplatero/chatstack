#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/adm-zip/util/constants.js
var require_constants = __commonJS({
  "node_modules/adm-zip/util/constants.js"(exports2, module2) {
    module2.exports = {
      /* The local file header */
      LOCHDR: 30,
      // LOC header size
      LOCSIG: 67324752,
      // "PK\003\004"
      LOCVER: 4,
      // version needed to extract
      LOCFLG: 6,
      // general purpose bit flag
      LOCHOW: 8,
      // compression method
      LOCTIM: 10,
      // modification time (2 bytes time, 2 bytes date)
      LOCCRC: 14,
      // uncompressed file crc-32 value
      LOCSIZ: 18,
      // compressed size
      LOCLEN: 22,
      // uncompressed size
      LOCNAM: 26,
      // filename length
      LOCEXT: 28,
      // extra field length
      /* The Data descriptor */
      EXTSIG: 134695760,
      // "PK\007\008"
      EXTHDR: 16,
      // EXT header size
      EXTCRC: 4,
      // uncompressed file crc-32 value
      EXTSIZ: 8,
      // compressed size
      EXTLEN: 12,
      // uncompressed size
      /* The central directory file header */
      CENHDR: 46,
      // CEN header size
      CENSIG: 33639248,
      // "PK\001\002"
      CENVEM: 4,
      // version made by
      CENVER: 6,
      // version needed to extract
      CENFLG: 8,
      // encrypt, decrypt flags
      CENHOW: 10,
      // compression method
      CENTIM: 12,
      // modification time (2 bytes time, 2 bytes date)
      CENCRC: 16,
      // uncompressed file crc-32 value
      CENSIZ: 20,
      // compressed size
      CENLEN: 24,
      // uncompressed size
      CENNAM: 28,
      // filename length
      CENEXT: 30,
      // extra field length
      CENCOM: 32,
      // file comment length
      CENDSK: 34,
      // volume number start
      CENATT: 36,
      // internal file attributes
      CENATX: 38,
      // external file attributes (host system dependent)
      CENOFF: 42,
      // LOC header offset
      /* The entries in the end of central directory */
      ENDHDR: 22,
      // END header size
      ENDSIG: 101010256,
      // "PK\005\006"
      ENDSUB: 8,
      // number of entries on this disk
      ENDTOT: 10,
      // total number of entries
      ENDSIZ: 12,
      // central directory size in bytes
      ENDOFF: 16,
      // offset of first CEN header
      ENDCOM: 20,
      // zip file comment length
      END64HDR: 20,
      // zip64 END header size
      END64SIG: 117853008,
      // zip64 Locator signature, "PK\006\007"
      END64START: 4,
      // number of the disk with the start of the zip64
      END64OFF: 8,
      // relative offset of the zip64 end of central directory
      END64NUMDISKS: 16,
      // total number of disks
      ZIP64SIG: 101075792,
      // zip64 signature, "PK\006\006"
      ZIP64HDR: 56,
      // zip64 record minimum size
      ZIP64LEAD: 12,
      // leading bytes at the start of the record, not counted by the value stored in ZIP64SIZE
      ZIP64SIZE: 4,
      // zip64 size of the central directory record
      ZIP64VEM: 12,
      // zip64 version made by
      ZIP64VER: 14,
      // zip64 version needed to extract
      ZIP64DSK: 16,
      // zip64 number of this disk
      ZIP64DSKDIR: 20,
      // number of the disk with the start of the record directory
      ZIP64SUB: 24,
      // number of entries on this disk
      ZIP64TOT: 32,
      // total number of entries
      ZIP64SIZB: 40,
      // zip64 central directory size in bytes
      ZIP64OFF: 48,
      // offset of start of central directory with respect to the starting disk number
      ZIP64EXTRA: 56,
      // extensible data sector
      /* Compression methods */
      STORED: 0,
      // no compression
      SHRUNK: 1,
      // shrunk
      REDUCED1: 2,
      // reduced with compression factor 1
      REDUCED2: 3,
      // reduced with compression factor 2
      REDUCED3: 4,
      // reduced with compression factor 3
      REDUCED4: 5,
      // reduced with compression factor 4
      IMPLODED: 6,
      // imploded
      // 7 reserved for Tokenizing compression algorithm
      DEFLATED: 8,
      // deflated
      ENHANCED_DEFLATED: 9,
      // enhanced deflated
      PKWARE: 10,
      // PKWare DCL imploded
      // 11 reserved by PKWARE
      BZIP2: 12,
      //  compressed using BZIP2
      // 13 reserved by PKWARE
      LZMA: 14,
      // LZMA
      // 15-17 reserved by PKWARE
      IBM_TERSE: 18,
      // compressed using IBM TERSE
      IBM_LZ77: 19,
      // IBM LZ77 z
      AES_ENCRYPT: 99,
      // WinZIP AES encryption method
      /* General purpose bit flag */
      // values can obtained with expression 2**bitnr
      FLG_ENC: 1,
      // Bit 0: encrypted file
      FLG_COMP1: 2,
      // Bit 1, compression option
      FLG_COMP2: 4,
      // Bit 2, compression option
      FLG_DESC: 8,
      // Bit 3, data descriptor
      FLG_ENH: 16,
      // Bit 4, enhanced deflating
      FLG_PATCH: 32,
      // Bit 5, indicates that the file is compressed patched data.
      FLG_STR: 64,
      // Bit 6, strong encryption (patented)
      // Bits 7-10: Currently unused.
      FLG_EFS: 2048,
      // Bit 11: Language encoding flag (EFS)
      // Bit 12: Reserved by PKWARE for enhanced compression.
      // Bit 13: encrypted the Central Directory (patented).
      // Bits 14-15: Reserved by PKWARE.
      FLG_MSK: 4096,
      // mask header values
      /* Load type */
      FILE: 2,
      BUFFER: 1,
      NONE: 0,
      /* 4.5 Extensible data fields */
      EF_ID: 0,
      EF_SIZE: 2,
      /* Header IDs */
      ID_ZIP64: 1,
      ID_AVINFO: 7,
      ID_PFS: 8,
      ID_OS2: 9,
      ID_NTFS: 10,
      ID_OPENVMS: 12,
      ID_UNIX: 13,
      ID_FORK: 14,
      ID_PATCH: 15,
      ID_X509_PKCS7: 20,
      ID_X509_CERTID_F: 21,
      ID_X509_CERTID_C: 22,
      ID_STRONGENC: 23,
      ID_RECORD_MGT: 24,
      ID_X509_PKCS7_RL: 25,
      ID_IBM1: 101,
      ID_IBM2: 102,
      ID_POSZIP: 18064,
      EF_ZIP64_OR_32: 4294967295,
      EF_ZIP64_OR_16: 65535,
      EF_ZIP64_SUNCOMP: 0,
      EF_ZIP64_SCOMP: 8,
      EF_ZIP64_RHO: 16,
      EF_ZIP64_DSN: 24
    };
  }
});

// node_modules/adm-zip/util/errors.js
var require_errors = __commonJS({
  "node_modules/adm-zip/util/errors.js"(exports2) {
    var errors = {
      /* Header error messages */
      INVALID_LOC: "Invalid LOC header (bad signature)",
      INVALID_CEN: "Invalid CEN header (bad signature)",
      INVALID_END: "Invalid END header (bad signature)",
      /* Descriptor */
      DESCRIPTOR_NOT_EXIST: "No descriptor present",
      DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
      DESCRIPTOR_FAULTY: "Descriptor data is malformed",
      /* ZipEntry error messages*/
      NO_DATA: "Nothing to decompress",
      BAD_CRC: "CRC32 checksum failed {0}",
      FILE_IN_THE_WAY: "There is a file in the way: {0}",
      UNKNOWN_METHOD: "Invalid/unsupported compression method",
      /* Inflater error messages */
      AVAIL_DATA: "inflate::Available inflate data did not terminate",
      INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
      TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
      INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
      INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
      INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
      INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
      INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
      INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
      INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
      /* ADM-ZIP error messages */
      CANT_EXTRACT_FILE: "Could not extract the file",
      CANT_OVERRIDE: "Target file already exists",
      DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
      NO_ZIP: "No zip file was loaded",
      NO_ENTRY: "Entry doesn't exist",
      DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
      FILE_NOT_FOUND: 'File not found: "{0}"',
      NOT_IMPLEMENTED: "Not implemented",
      INVALID_FILENAME: "Invalid filename",
      INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
      INVALID_PASS_PARAM: "Incompatible password parameter",
      WRONG_PASSWORD: "Wrong Password",
      /* ADM-ZIP */
      COMMENT_TOO_LONG: "Comment is too long",
      // Comment can be max 65535 bytes long (NOTE: some non-US characters may take more space)
      EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
    };
    function E(message) {
      return function(...args) {
        if (args.length) {
          message = message.replace(/\{(\d)\}/g, (_, n) => args[n] || "");
        }
        return new Error("ADM-ZIP: " + message);
      };
    }
    for (const msg of Object.keys(errors)) {
      exports2[msg] = E(errors[msg]);
    }
  }
});

// node_modules/adm-zip/util/utils.js
var require_utils = __commonJS({
  "node_modules/adm-zip/util/utils.js"(exports2, module2) {
    var fsystem = require("fs");
    var pth = require("path");
    var Constants = require_constants();
    var Errors = require_errors();
    var isWin = typeof process === "object" && "win32" === process.platform;
    var is_Obj = (obj) => typeof obj === "object" && obj !== null;
    var crcTable = new Uint32Array(256).map((t, c) => {
      for (let k = 0; k < 8; k++) {
        if ((c & 1) !== 0) {
          c = 3988292384 ^ c >>> 1;
        } else {
          c >>>= 1;
        }
      }
      return c >>> 0;
    });
    function Utils(opts) {
      this.sep = pth.sep;
      this.fs = fsystem;
      if (is_Obj(opts)) {
        if (is_Obj(opts.fs) && typeof opts.fs.statSync === "function") {
          this.fs = opts.fs;
        }
      }
    }
    module2.exports = Utils;
    Utils.prototype.makeDir = function(folder) {
      const self = this;
      function mkdirSync5(fpath) {
        let resolvedPath = fpath.split(self.sep)[0];
        fpath.split(self.sep).forEach(function(name) {
          if (!name || name.substr(-1, 1) === ":") return;
          resolvedPath += self.sep + name;
          var stat;
          try {
            stat = self.fs.statSync(resolvedPath);
          } catch (e) {
            if (e.message && e.message.startsWith("ENOENT")) {
              self.fs.mkdirSync(resolvedPath);
            } else {
              throw e;
            }
          }
          if (stat && stat.isFile()) throw Errors.FILE_IN_THE_WAY(`"${resolvedPath}"`);
        });
      }
      mkdirSync5(folder);
    };
    Utils.prototype.writeFileTo = function(path, content, overwrite, attr) {
      const self = this;
      if (self.fs.existsSync(path)) {
        if (!overwrite) return false;
        var stat = self.fs.statSync(path);
        if (stat.isDirectory()) {
          return false;
        }
      }
      var folder = pth.dirname(path);
      if (!self.fs.existsSync(folder)) {
        self.makeDir(folder);
      }
      var fd;
      try {
        fd = self.fs.openSync(path, "w", 438);
      } catch (e) {
        self.fs.chmodSync(path, 438);
        fd = self.fs.openSync(path, "w", 438);
      }
      if (fd) {
        try {
          self.fs.writeSync(fd, content, 0, content.length, 0);
        } finally {
          self.fs.closeSync(fd);
        }
      }
      self.fs.chmodSync(path, attr || 438);
      return true;
    };
    Utils.prototype.writeFileToAsync = function(path, content, overwrite, attr, callback) {
      if (typeof attr === "function") {
        callback = attr;
        attr = void 0;
      }
      const self = this;
      self.fs.exists(path, function(exist) {
        if (exist && !overwrite) return callback(false);
        self.fs.stat(path, function(err, stat) {
          if (exist && stat && stat.isDirectory()) {
            return callback(false);
          }
          var folder = pth.dirname(path);
          self.fs.exists(folder, function(exists) {
            if (!exists) {
              try {
                self.makeDir(folder);
              } catch (e) {
                return callback(false);
              }
            }
            const writeToFd = function(fd) {
              self.fs.write(fd, content, 0, content.length, 0, function(writeErr) {
                self.fs.close(fd, function() {
                  if (writeErr) return callback(false);
                  self.fs.chmod(path, attr || 438, function() {
                    callback(true);
                  });
                });
              });
            };
            self.fs.open(path, "w", 438, function(err2, fd) {
              if (err2) {
                self.fs.chmod(path, 438, function() {
                  self.fs.open(path, "w", 438, function(retryErr, fd2) {
                    if (retryErr || !fd2) return callback(false);
                    writeToFd(fd2);
                  });
                });
              } else if (fd) {
                writeToFd(fd);
              } else {
                callback(false);
              }
            });
          });
        });
      });
    };
    Utils.prototype.findFiles = function(path) {
      const self = this;
      function findSync(dir, pattern, recursive, visited) {
        if (typeof pattern === "boolean") {
          recursive = pattern;
          pattern = void 0;
        }
        let files = [];
        self.fs.readdirSync(dir).forEach(function(file) {
          const path2 = pth.join(dir, file);
          const stat = self.fs.statSync(path2);
          if (!pattern || pattern.test(path2)) {
            files.push(pth.normalize(path2) + (stat.isDirectory() ? self.sep : ""));
          }
          if (stat.isDirectory() && recursive) {
            const realDir = self.fs.realpathSync(path2);
            if (!visited.has(realDir)) {
              visited.add(realDir);
              files = files.concat(findSync(path2, pattern, recursive, visited));
            }
          }
        });
        return files;
      }
      return findSync(path, void 0, true, /* @__PURE__ */ new Set([self.fs.realpathSync(path)]));
    };
    Utils.prototype.findFilesAsync = function(dir, cb) {
      const self = this;
      const results = [];
      let finished = false;
      const finish = function(err) {
        if (finished) return;
        finished = true;
        cb(err, err ? void 0 : results);
      };
      const walk = function(dir2, visited, done) {
        self.fs.readdir(dir2, function(err, list) {
          if (err) return done(err);
          let pending = list.length;
          if (!pending) return done();
          list.forEach(function(name) {
            const file = pth.join(dir2, name);
            self.fs.stat(file, function(err2, stat) {
              if (err2) return done(err2);
              if (!stat) {
                if (!--pending) done();
                return;
              }
              results.push(pth.normalize(file) + (stat.isDirectory() ? self.sep : ""));
              if (!stat.isDirectory()) {
                if (!--pending) done();
                return;
              }
              self.fs.realpath(file, function(err3, realDir) {
                if (err3) return done(err3);
                if (visited.has(realDir)) {
                  if (!--pending) done();
                  return;
                }
                visited.add(realDir);
                walk(file, visited, function(err4) {
                  if (err4) return done(err4);
                  if (!--pending) done();
                });
              });
            });
          });
        });
      };
      self.fs.realpath(dir, function(err, realDir) {
        if (err) return finish(err);
        walk(dir, /* @__PURE__ */ new Set([realDir]), finish);
      });
    };
    Utils.prototype.getAttributes = function() {
    };
    Utils.prototype.setAttributes = function() {
    };
    Utils.crc32update = function(crc, byte) {
      return crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
    };
    Utils.crc32 = function(buf) {
      if (typeof buf === "string") {
        buf = Buffer.from(buf, "utf8");
      }
      let len = buf.length;
      let crc = ~0;
      for (let off = 0; off < len; ) crc = Utils.crc32update(crc, buf[off++]);
      return ~crc >>> 0;
    };
    Utils.methodToString = function(method) {
      switch (method) {
        case Constants.STORED:
          return "STORED (" + method + ")";
        case Constants.DEFLATED:
          return "DEFLATED (" + method + ")";
        default:
          return "UNSUPPORTED (" + method + ")";
      }
    };
    Utils.canonical = function(path) {
      if (!path) return "";
      const safeSuffix = pth.posix.normalize("/" + path.split("\\").join("/"));
      return pth.join(".", safeSuffix);
    };
    Utils.zipnamefix = function(path) {
      if (!path) return "";
      const safeSuffix = pth.posix.normalize("/" + path.split("\\").join("/"));
      return pth.posix.join(".", safeSuffix);
    };
    Utils.findLast = function(arr, callback) {
      if (!Array.isArray(arr)) throw new TypeError("arr is not array");
      const len = arr.length >>> 0;
      for (let i = len - 1; i >= 0; i--) {
        if (callback(arr[i], i, arr)) {
          return arr[i];
        }
      }
      return void 0;
    };
    Utils.sanitize = function(prefix, name) {
      prefix = pth.resolve(pth.normalize(prefix));
      var parts = name.split("/");
      for (var i = 0, l = parts.length; i < l; i++) {
        var path = pth.normalize(pth.join(prefix, parts.slice(i, l).join(pth.sep)));
        if (path === prefix || path.startsWith(prefix + pth.sep)) {
          return path;
        }
      }
      return pth.normalize(pth.join(prefix, pth.basename(name)));
    };
    Utils.toBuffer = function toBuffer(input, encoder) {
      if (Buffer.isBuffer(input)) {
        return input;
      } else if (input instanceof Uint8Array) {
        return Buffer.from(input);
      } else {
        return typeof input === "string" ? encoder(input) : Buffer.alloc(0);
      }
    };
    Utils.readBigUInt64LE = function(buffer, index) {
      const lo = buffer.readUInt32LE(index);
      const hi = buffer.readUInt32LE(index + 4);
      return hi * 4294967296 + lo;
    };
    Utils.writeBigUInt64LE = function(buffer, value, index) {
      const lo = value >>> 0;
      const hi = Math.floor(value / 4294967296) >>> 0;
      buffer.writeUInt32LE(lo, index);
      buffer.writeUInt32LE(hi, index + 4);
    };
    Utils.fromDOS2Date = function(val) {
      return new Date((val >> 25 & 127) + 1980, Math.max((val >> 21 & 15) - 1, 0), Math.max(val >> 16 & 31, 1), val >> 11 & 31, val >> 5 & 63, (val & 31) << 1);
    };
    Utils.fromDate2DOS = function(val) {
      let date = 0;
      let time = 0;
      if (val.getFullYear() > 1979) {
        date = (val.getFullYear() - 1980 & 127) << 9 | val.getMonth() + 1 << 5 | val.getDate();
        time = val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
      }
      return date << 16 | time;
    };
    Utils.isWin = isWin;
    Utils.crcTable = crcTable;
  }
});

// node_modules/adm-zip/util/fattr.js
var require_fattr = __commonJS({
  "node_modules/adm-zip/util/fattr.js"(exports2, module2) {
    var pth = require("path");
    module2.exports = function(path, { fs }) {
      var _path = path || "", _obj = newAttr(), _stat = null;
      function newAttr() {
        return {
          directory: false,
          readonly: false,
          hidden: false,
          executable: false,
          mtime: 0,
          atime: 0
        };
      }
      if (_path && fs.existsSync(_path)) {
        _stat = fs.statSync(_path);
        _obj.directory = _stat.isDirectory();
        _obj.mtime = _stat.mtime;
        _obj.atime = _stat.atime;
        _obj.executable = (73 & _stat.mode) !== 0;
        _obj.readonly = (128 & _stat.mode) === 0;
        _obj.hidden = pth.basename(_path)[0] === ".";
      } else {
        console.warn("Invalid path: " + _path);
      }
      return {
        get directory() {
          return _obj.directory;
        },
        get readOnly() {
          return _obj.readonly;
        },
        get hidden() {
          return _obj.hidden;
        },
        get mtime() {
          return _obj.mtime;
        },
        get atime() {
          return _obj.atime;
        },
        get executable() {
          return _obj.executable;
        },
        decodeAttributes: function() {
        },
        encodeAttributes: function() {
        },
        toJSON: function() {
          return {
            path: _path,
            isDirectory: _obj.directory,
            isReadOnly: _obj.readonly,
            isHidden: _obj.hidden,
            isExecutable: _obj.executable,
            mTime: _obj.mtime,
            aTime: _obj.atime
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/util/decoder.js
var require_decoder = __commonJS({
  "node_modules/adm-zip/util/decoder.js"(exports2, module2) {
    module2.exports = {
      efs: true,
      encode: (data) => Buffer.from(data, "utf8"),
      decode: (data) => data.toString("utf8")
    };
  }
});

// node_modules/adm-zip/util/index.js
var require_util = __commonJS({
  "node_modules/adm-zip/util/index.js"(exports2, module2) {
    module2.exports = require_utils();
    module2.exports.Constants = require_constants();
    module2.exports.Errors = require_errors();
    module2.exports.FileAttr = require_fattr();
    module2.exports.decoder = require_decoder();
  }
});

// node_modules/adm-zip/headers/entryHeader.js
var require_entryHeader = __commonJS({
  "node_modules/adm-zip/headers/entryHeader.js"(exports2, module2) {
    var Utils = require_util();
    var Constants = Utils.Constants;
    module2.exports = function() {
      var _verMade = 20, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
      _verMade |= Utils.isWin ? 2560 : 768;
      _flags |= Constants.FLG_EFS;
      const _localHeader = {
        extraLen: 0
      };
      const uint32 = (val) => Math.max(0, val) >>> 0;
      const uint16 = (val) => Math.max(0, val) & 65535;
      const uint8 = (val) => Math.max(0, val) & 255;
      _time = Utils.fromDate2DOS(/* @__PURE__ */ new Date());
      return {
        get made() {
          return _verMade;
        },
        set made(val) {
          _verMade = val;
        },
        get version() {
          return _version;
        },
        set version(val) {
          _version = val;
        },
        get flags() {
          return _flags;
        },
        set flags(val) {
          _flags = val;
        },
        get flags_efs() {
          return (_flags & Constants.FLG_EFS) > 0;
        },
        set flags_efs(val) {
          if (val) {
            _flags |= Constants.FLG_EFS;
          } else {
            _flags &= ~Constants.FLG_EFS;
          }
        },
        get flags_desc() {
          return (_flags & Constants.FLG_DESC) > 0;
        },
        set flags_desc(val) {
          if (val) {
            _flags |= Constants.FLG_DESC;
          } else {
            _flags &= ~Constants.FLG_DESC;
          }
        },
        get method() {
          return _method;
        },
        set method(val) {
          switch (val) {
            case Constants.STORED:
              this.version = 10;
              break;
            case Constants.DEFLATED:
            default:
              this.version = 20;
          }
          _method = val;
        },
        get time() {
          return Utils.fromDOS2Date(this.timeval);
        },
        set time(val) {
          val = new Date(val);
          this.timeval = Utils.fromDate2DOS(val);
        },
        get timeval() {
          return _time;
        },
        set timeval(val) {
          _time = uint32(val);
        },
        get timeHighByte() {
          return uint8(_time >>> 8);
        },
        get crc() {
          return _crc;
        },
        set crc(val) {
          _crc = uint32(val);
        },
        get compressedSize() {
          return _compressedSize;
        },
        set compressedSize(val) {
          _compressedSize = uint32(val);
        },
        get size() {
          return _size;
        },
        set size(val) {
          _size = uint32(val);
        },
        get fileNameLength() {
          return _fnameLen;
        },
        set fileNameLength(val) {
          _fnameLen = val;
        },
        get extraLength() {
          return _extraLen;
        },
        set extraLength(val) {
          _extraLen = val;
        },
        get extraLocalLength() {
          return _localHeader.extraLen;
        },
        set extraLocalLength(val) {
          _localHeader.extraLen = val;
        },
        get commentLength() {
          return _comLen;
        },
        set commentLength(val) {
          _comLen = val;
        },
        get diskNumStart() {
          return _diskStart;
        },
        set diskNumStart(val) {
          _diskStart = uint32(val);
        },
        get inAttr() {
          return _inattr;
        },
        set inAttr(val) {
          _inattr = uint32(val);
        },
        get attr() {
          return _attr;
        },
        set attr(val) {
          _attr = uint32(val);
        },
        // get Unix file permissions
        get fileAttr() {
          return (_attr || 0) >> 16 & 4095;
        },
        get offset() {
          return _offset;
        },
        set offset(val) {
          _offset = uint32(val);
        },
        get encrypted() {
          return (_flags & Constants.FLG_ENC) === Constants.FLG_ENC;
        },
        get centralHeaderSize() {
          return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
        },
        get realDataOffset() {
          return _offset + Constants.LOCHDR + _localHeader.fnameLen + _localHeader.extraLen;
        },
        get localHeader() {
          return _localHeader;
        },
        loadLocalHeaderFromBinary: function(input) {
          var data = input.slice(_offset, _offset + Constants.LOCHDR);
          if (data.readUInt32LE(0) !== Constants.LOCSIG) {
            throw Utils.Errors.INVALID_LOC();
          }
          _localHeader.version = data.readUInt16LE(Constants.LOCVER);
          _localHeader.flags = data.readUInt16LE(Constants.LOCFLG);
          _localHeader.flags_desc = (_localHeader.flags & Constants.FLG_DESC) > 0;
          _localHeader.method = data.readUInt16LE(Constants.LOCHOW);
          _localHeader.time = data.readUInt32LE(Constants.LOCTIM);
          _localHeader.crc = data.readUInt32LE(Constants.LOCCRC);
          _localHeader.compressedSize = data.readUInt32LE(Constants.LOCSIZ);
          _localHeader.size = data.readUInt32LE(Constants.LOCLEN);
          _localHeader.fnameLen = data.readUInt16LE(Constants.LOCNAM);
          _localHeader.extraLen = data.readUInt16LE(Constants.LOCEXT);
          const extraStart = _offset + Constants.LOCHDR + _localHeader.fnameLen;
          const extraEnd = extraStart + _localHeader.extraLen;
          return input.slice(extraStart, extraEnd);
        },
        loadFromBinary: function(data) {
          if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) {
            throw Utils.Errors.INVALID_CEN();
          }
          _verMade = data.readUInt16LE(Constants.CENVEM);
          _version = data.readUInt16LE(Constants.CENVER);
          _flags = data.readUInt16LE(Constants.CENFLG);
          _method = data.readUInt16LE(Constants.CENHOW);
          _time = data.readUInt32LE(Constants.CENTIM);
          _crc = data.readUInt32LE(Constants.CENCRC);
          _compressedSize = data.readUInt32LE(Constants.CENSIZ);
          _size = data.readUInt32LE(Constants.CENLEN);
          _fnameLen = data.readUInt16LE(Constants.CENNAM);
          _extraLen = data.readUInt16LE(Constants.CENEXT);
          _comLen = data.readUInt16LE(Constants.CENCOM);
          _diskStart = data.readUInt16LE(Constants.CENDSK);
          _inattr = data.readUInt16LE(Constants.CENATT);
          _attr = data.readUInt32LE(Constants.CENATX);
          _offset = data.readUInt32LE(Constants.CENOFF);
        },
        localHeaderToBinary: function() {
          var data = Buffer.alloc(Constants.LOCHDR);
          data.writeUInt32LE(Constants.LOCSIG, 0);
          data.writeUInt16LE(_version, Constants.LOCVER);
          data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.LOCFLG);
          data.writeUInt16LE(_method, Constants.LOCHOW);
          data.writeUInt32LE(_time, Constants.LOCTIM);
          data.writeUInt32LE(_crc, Constants.LOCCRC);
          data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
          data.writeUInt32LE(_size, Constants.LOCLEN);
          data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
          data.writeUInt16LE(_localHeader.extraLen, Constants.LOCEXT);
          return data;
        },
        centralHeaderToBinary: function() {
          var data = Buffer.alloc(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
          data.writeUInt32LE(Constants.CENSIG, 0);
          data.writeUInt16LE(_verMade, Constants.CENVEM);
          data.writeUInt16LE(_version, Constants.CENVER);
          data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.CENFLG);
          data.writeUInt16LE(_method, Constants.CENHOW);
          data.writeUInt32LE(_time, Constants.CENTIM);
          data.writeUInt32LE(_crc, Constants.CENCRC);
          data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
          data.writeUInt32LE(_size, Constants.CENLEN);
          data.writeUInt16LE(_fnameLen, Constants.CENNAM);
          data.writeUInt16LE(_extraLen, Constants.CENEXT);
          data.writeUInt16LE(_comLen, Constants.CENCOM);
          data.writeUInt16LE(_diskStart, Constants.CENDSK);
          data.writeUInt16LE(_inattr, Constants.CENATT);
          data.writeUInt32LE(_attr, Constants.CENATX);
          data.writeUInt32LE(_offset, Constants.CENOFF);
          return data;
        },
        toJSON: function() {
          const bytes = function(nr) {
            return nr + " bytes";
          };
          return {
            made: _verMade,
            version: _version,
            flags: _flags,
            method: Utils.methodToString(_method),
            time: this.time,
            crc: "0x" + _crc.toString(16).toUpperCase(),
            compressedSize: bytes(_compressedSize),
            size: bytes(_size),
            fileNameLength: bytes(_fnameLen),
            extraLength: bytes(_extraLen),
            commentLength: bytes(_comLen),
            diskNumStart: _diskStart,
            inAttr: _inattr,
            attr: _attr,
            offset: _offset,
            centralHeaderSize: bytes(Constants.CENHDR + _fnameLen + _extraLen + _comLen)
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/headers/mainHeader.js
var require_mainHeader = __commonJS({
  "node_modules/adm-zip/headers/mainHeader.js"(exports2, module2) {
    var Utils = require_util();
    var Constants = Utils.Constants;
    module2.exports = function() {
      var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
      const needsZip64 = () => _volumeEntries > Constants.EF_ZIP64_OR_16 || _totalEntries > Constants.EF_ZIP64_OR_16 || _size > Constants.EF_ZIP64_OR_32 || _offset > Constants.EF_ZIP64_OR_32;
      return {
        get diskEntries() {
          return _volumeEntries;
        },
        set diskEntries(val) {
          _volumeEntries = _totalEntries = val;
        },
        get totalEntries() {
          return _totalEntries;
        },
        set totalEntries(val) {
          _totalEntries = _volumeEntries = val;
        },
        get size() {
          return _size;
        },
        set size(val) {
          _size = val;
        },
        get offset() {
          return _offset;
        },
        set offset(val) {
          _offset = val;
        },
        get commentLength() {
          return _commentLength;
        },
        set commentLength(val) {
          _commentLength = val;
        },
        get mainHeaderSize() {
          return (needsZip64() ? Constants.ZIP64HDR + Constants.END64HDR : 0) + Constants.ENDHDR + _commentLength;
        },
        loadFromBinary: function(data) {
          if ((data.length !== Constants.ENDHDR || data.readUInt32LE(0) !== Constants.ENDSIG) && (data.length < Constants.ZIP64HDR || data.readUInt32LE(0) !== Constants.ZIP64SIG)) {
            throw Utils.Errors.INVALID_END();
          }
          if (data.readUInt32LE(0) === Constants.ENDSIG) {
            _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
            _totalEntries = data.readUInt16LE(Constants.ENDTOT);
            _size = data.readUInt32LE(Constants.ENDSIZ);
            _offset = data.readUInt32LE(Constants.ENDOFF);
            _commentLength = data.readUInt16LE(Constants.ENDCOM);
          } else {
            _volumeEntries = Utils.readBigUInt64LE(data, Constants.ZIP64SUB);
            _totalEntries = Utils.readBigUInt64LE(data, Constants.ZIP64TOT);
            _size = Utils.readBigUInt64LE(data, Constants.ZIP64SIZB);
            _offset = Utils.readBigUInt64LE(data, Constants.ZIP64OFF);
            _commentLength = 0;
          }
        },
        toBinary: function() {
          if (!needsZip64()) {
            var b = Buffer.alloc(Constants.ENDHDR + _commentLength);
            b.writeUInt32LE(Constants.ENDSIG, 0);
            b.writeUInt32LE(0, 4);
            b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
            b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
            b.writeUInt32LE(_size, Constants.ENDSIZ);
            b.writeUInt32LE(_offset, Constants.ENDOFF);
            b.writeUInt16LE(_commentLength, Constants.ENDCOM);
            b.fill(" ", Constants.ENDHDR);
            return b;
          }
          var b = Buffer.alloc(this.mainHeaderSize);
          let offset = 0;
          b.writeUInt32LE(Constants.ZIP64SIG, offset);
          Utils.writeBigUInt64LE(b, Constants.ZIP64HDR - Constants.ZIP64LEAD, offset + Constants.ZIP64SIZE);
          b.writeUInt16LE(45, offset + Constants.ZIP64VEM);
          b.writeUInt16LE(45, offset + Constants.ZIP64VER);
          b.writeUInt32LE(0, offset + Constants.ZIP64DSK);
          b.writeUInt32LE(0, offset + Constants.ZIP64DSKDIR);
          Utils.writeBigUInt64LE(b, _volumeEntries, offset + Constants.ZIP64SUB);
          Utils.writeBigUInt64LE(b, _totalEntries, offset + Constants.ZIP64TOT);
          Utils.writeBigUInt64LE(b, _size, offset + Constants.ZIP64SIZB);
          Utils.writeBigUInt64LE(b, _offset, offset + Constants.ZIP64OFF);
          const zip64EndOffset = _offset + _size;
          offset += Constants.ZIP64HDR;
          b.writeUInt32LE(Constants.END64SIG, offset);
          b.writeUInt32LE(0, offset + Constants.END64START);
          Utils.writeBigUInt64LE(b, zip64EndOffset, offset + Constants.END64OFF);
          b.writeUInt32LE(1, offset + Constants.END64NUMDISKS);
          offset += Constants.END64HDR;
          b.writeUInt32LE(Constants.ENDSIG, offset);
          b.writeUInt32LE(0, offset + 4);
          b.writeUInt16LE(Math.min(_volumeEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDSUB);
          b.writeUInt16LE(Math.min(_totalEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDTOT);
          b.writeUInt32LE(Math.min(_size, Constants.EF_ZIP64_OR_32), offset + Constants.ENDSIZ);
          b.writeUInt32LE(Math.min(_offset, Constants.EF_ZIP64_OR_32), offset + Constants.ENDOFF);
          b.writeUInt16LE(_commentLength, offset + Constants.ENDCOM);
          b.fill(" ", offset + Constants.ENDHDR);
          return b;
        },
        toJSON: function() {
          const offset = function(nr, len) {
            let offs = nr.toString(16).toUpperCase();
            while (offs.length < len) offs = "0" + offs;
            return "0x" + offs;
          };
          return {
            diskEntries: _volumeEntries,
            totalEntries: _totalEntries,
            size: _size + " bytes",
            offset: offset(_offset, 4),
            commentLength: _commentLength
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/headers/index.js
var require_headers = __commonJS({
  "node_modules/adm-zip/headers/index.js"(exports2) {
    exports2.EntryHeader = require_entryHeader();
    exports2.MainHeader = require_mainHeader();
  }
});

// node_modules/adm-zip/methods/deflater.js
var require_deflater = __commonJS({
  "node_modules/adm-zip/methods/deflater.js"(exports2, module2) {
    module2.exports = function(inbuf) {
      var zlib = require("zlib");
      var opts = { chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024 };
      return {
        deflate: function() {
          return zlib.deflateRawSync(inbuf, opts);
        },
        deflateAsync: function(callback) {
          var tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
          tmp.on("data", function(data) {
            parts.push(data);
            total += data.length;
          });
          tmp.on("end", function() {
            var buf = Buffer.alloc(total), written = 0;
            buf.fill(0);
            for (var i = 0; i < parts.length; i++) {
              var part = parts[i];
              part.copy(buf, written);
              written += part.length;
            }
            callback && callback(buf);
          });
          tmp.end(inbuf);
        }
      };
    };
  }
});

// node_modules/adm-zip/methods/inflater.js
var require_inflater = __commonJS({
  "node_modules/adm-zip/methods/inflater.js"(exports2, module2) {
    var version = +(process?.versions?.node ?? "").split(".")[0] || 0;
    module2.exports = function(inbuf, expectedLength) {
      var zlib = require("zlib");
      const option = version >= 15 && expectedLength > 0 ? { maxOutputLength: expectedLength } : {};
      return {
        inflate: function() {
          return zlib.inflateRawSync(inbuf, option);
        },
        inflateAsync: function(callback) {
          var tmp = zlib.createInflateRaw(option), parts = [], total = 0;
          tmp.on("data", function(data) {
            parts.push(data);
            total += data.length;
          });
          tmp.on("end", function() {
            var buf = Buffer.alloc(total), written = 0;
            buf.fill(0);
            for (var i = 0; i < parts.length; i++) {
              var part = parts[i];
              part.copy(buf, written);
              written += part.length;
            }
            callback && callback(buf);
          });
          tmp.end(inbuf);
        }
      };
    };
  }
});

// node_modules/adm-zip/methods/zipcrypto.js
var require_zipcrypto = __commonJS({
  "node_modules/adm-zip/methods/zipcrypto.js"(exports2, module2) {
    "use strict";
    var { randomFillSync } = require("crypto");
    var Errors = require_errors();
    var crctable = new Uint32Array(256).map((t, crc) => {
      for (let j = 0; j < 8; j++) {
        if (0 !== (crc & 1)) {
          crc = crc >>> 1 ^ 3988292384;
        } else {
          crc >>>= 1;
        }
      }
      return crc >>> 0;
    });
    var uMul = (a, b) => Math.imul(a, b) >>> 0;
    var crc32update = (pCrc32, bval) => {
      return crctable[(pCrc32 ^ bval) & 255] ^ pCrc32 >>> 8;
    };
    var genSalt = () => {
      if ("function" === typeof randomFillSync) {
        return randomFillSync(Buffer.alloc(12));
      } else {
        return genSalt.node();
      }
    };
    genSalt.node = () => {
      const salt = Buffer.alloc(12);
      const len = salt.length;
      for (let i = 0; i < len; i++) salt[i] = Math.random() * 256 & 255;
      return salt;
    };
    var config = {
      genSalt
    };
    function Initkeys(pw) {
      const pass = Buffer.isBuffer(pw) ? pw : Buffer.from(pw);
      this.keys = new Uint32Array([305419896, 591751049, 878082192]);
      for (let i = 0; i < pass.length; i++) {
        this.updateKeys(pass[i]);
      }
    }
    Initkeys.prototype.updateKeys = function(byteValue) {
      const keys = this.keys;
      keys[0] = crc32update(keys[0], byteValue);
      keys[1] += keys[0] & 255;
      keys[1] = uMul(keys[1], 134775813) + 1;
      keys[2] = crc32update(keys[2], keys[1] >>> 24);
      return byteValue;
    };
    Initkeys.prototype.next = function() {
      const k = (this.keys[2] | 2) >>> 0;
      return uMul(k, k ^ 1) >> 8 & 255;
    };
    function make_decrypter(pwd) {
      const keys = new Initkeys(pwd);
      return function(data) {
        const result = Buffer.alloc(data.length);
        let pos = 0;
        for (let c of data) {
          result[pos++] = keys.updateKeys(c ^ keys.next());
        }
        return result;
      };
    }
    function make_encrypter(pwd) {
      const keys = new Initkeys(pwd);
      return function(data, result, pos = 0) {
        if (!result) result = Buffer.alloc(data.length);
        for (let c of data) {
          const k = keys.next();
          result[pos++] = c ^ k;
          keys.updateKeys(c);
        }
        return result;
      };
    }
    function decrypt(data, header, pwd) {
      if (!data || !Buffer.isBuffer(data) || data.length < 12) {
        return Buffer.alloc(0);
      }
      const decrypter = make_decrypter(pwd);
      const salt = decrypter(data.slice(0, 12));
      const verifyByte = (header.flags & 8) === 8 ? header.timeHighByte : header.crc >>> 24;
      if (salt[11] !== verifyByte) {
        throw Errors.WRONG_PASSWORD();
      }
      return decrypter(data.slice(12));
    }
    function _salter(data) {
      if (Buffer.isBuffer(data) && data.length >= 12) {
        config.genSalt = function() {
          return data.slice(0, 12);
        };
      } else if (data === "node") {
        config.genSalt = genSalt.node;
      } else {
        config.genSalt = genSalt;
      }
    }
    function encrypt(data, header, pwd, oldlike = false) {
      if (data == null) data = Buffer.alloc(0);
      if (!Buffer.isBuffer(data)) data = Buffer.from(data.toString());
      const encrypter = make_encrypter(pwd);
      const salt = config.genSalt();
      salt[11] = header.crc >>> 24 & 255;
      if (oldlike) salt[10] = header.crc >>> 16 & 255;
      const result = Buffer.alloc(data.length + 12);
      encrypter(salt, result);
      return encrypter(data, result, 12);
    }
    module2.exports = { decrypt, encrypt, _salter };
  }
});

// node_modules/adm-zip/methods/index.js
var require_methods = __commonJS({
  "node_modules/adm-zip/methods/index.js"(exports2) {
    exports2.Deflater = require_deflater();
    exports2.Inflater = require_inflater();
    exports2.ZipCrypto = require_zipcrypto();
  }
});

// node_modules/adm-zip/zipEntry.js
var require_zipEntry = __commonJS({
  "node_modules/adm-zip/zipEntry.js"(exports2, module2) {
    var Utils = require_util();
    var Headers = require_headers();
    var Constants = Utils.Constants;
    var Methods = require_methods();
    module2.exports = function(options, input) {
      var _centralHeader = new Headers.EntryHeader(), _entryName = Buffer.alloc(0), _comment = Buffer.alloc(0), _isDirectory = false, uncompressedData = null, _extra = Buffer.alloc(0), _extralocal = Buffer.alloc(0), _efs = true;
      const opts = options;
      const decoder = typeof opts.decoder === "object" ? opts.decoder : Utils.decoder;
      _efs = decoder.hasOwnProperty("efs") ? decoder.efs : false;
      function getCompressedDataFromZip() {
        if (!input || !(input instanceof Uint8Array)) {
          return Buffer.alloc(0);
        }
        _extralocal = _centralHeader.loadLocalHeaderFromBinary(input);
        return input.slice(_centralHeader.realDataOffset, _centralHeader.realDataOffset + _centralHeader.compressedSize);
      }
      function crc32OK(data) {
        const expectedCrc = _centralHeader.flags_desc || _centralHeader.localHeader.flags_desc ? _centralHeader.crc : _centralHeader.localHeader.crc;
        return Utils.crc32(data) === expectedCrc;
      }
      function decompress(async, callback, pass) {
        if (typeof callback === "undefined" && typeof async === "string") {
          pass = async;
          async = void 0;
        }
        if (_isDirectory) {
          if (async && callback) {
            callback(Buffer.alloc(0), Utils.Errors.DIRECTORY_CONTENT_ERROR());
          }
          return Buffer.alloc(0);
        }
        var compressedData = getCompressedDataFromZip();
        if (compressedData.length === 0) {
          if (async && callback) callback(compressedData);
          return compressedData;
        }
        if (_centralHeader.encrypted) {
          if ("string" !== typeof pass && !Buffer.isBuffer(pass)) {
            throw Utils.Errors.INVALID_PASS_PARAM();
          }
          compressedData = Methods.ZipCrypto.decrypt(compressedData, _centralHeader, pass);
        }
        var data;
        switch (_centralHeader.method) {
          case Utils.Constants.STORED:
            data = Buffer.alloc(compressedData.length);
            compressedData.copy(data);
            if (!crc32OK(data)) {
              if (async && callback) callback(data, Utils.Errors.BAD_CRC());
              throw Utils.Errors.BAD_CRC();
            } else {
              if (async && callback) callback(data);
              return data;
            }
          case Utils.Constants.DEFLATED:
            var inflater = new Methods.Inflater(compressedData, _centralHeader.size);
            if (!async) {
              data = inflater.inflate();
              if (!crc32OK(data)) {
                throw Utils.Errors.BAD_CRC(`"${decoder.decode(_entryName)}"`);
              }
              return data;
            } else {
              inflater.inflateAsync(function(result) {
                if (callback) {
                  if (!crc32OK(result)) {
                    callback(result, Utils.Errors.BAD_CRC());
                  } else {
                    callback(result);
                  }
                }
              });
            }
            break;
          default:
            if (async && callback) callback(Buffer.alloc(0), Utils.Errors.UNKNOWN_METHOD());
            throw Utils.Errors.UNKNOWN_METHOD();
        }
      }
      function compress(async, callback) {
        if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
          if (async && callback) callback(getCompressedDataFromZip());
          return getCompressedDataFromZip();
        }
        if (uncompressedData.length && !_isDirectory) {
          var compressedData;
          switch (_centralHeader.method) {
            case Utils.Constants.STORED:
              _centralHeader.compressedSize = _centralHeader.size;
              compressedData = Buffer.alloc(uncompressedData.length);
              uncompressedData.copy(compressedData);
              if (async && callback) callback(compressedData);
              return compressedData;
            default:
            case Utils.Constants.DEFLATED:
              var deflater = new Methods.Deflater(uncompressedData);
              if (!async) {
                var deflated = deflater.deflate();
                _centralHeader.compressedSize = deflated.length;
                return deflated;
              } else {
                deflater.deflateAsync(function(data) {
                  compressedData = Buffer.alloc(data.length);
                  _centralHeader.compressedSize = data.length;
                  data.copy(compressedData);
                  callback && callback(compressedData);
                });
              }
              deflater = null;
              break;
          }
        } else if (async && callback) {
          callback(Buffer.alloc(0));
        } else {
          return Buffer.alloc(0);
        }
      }
      function readUInt64LE(buffer, offset) {
        return Utils.readBigUInt64LE(buffer, offset);
      }
      function parseExtra(data) {
        try {
          var offset = 0;
          var signature, size, part;
          while (offset + 4 < data.length) {
            signature = data.readUInt16LE(offset);
            offset += 2;
            size = data.readUInt16LE(offset);
            offset += 2;
            part = data.slice(offset, offset + size);
            offset += size;
            if (Constants.ID_ZIP64 === signature) {
              parseZip64ExtendedInformation(part);
            }
          }
        } catch (error) {
          throw Utils.Errors.EXTRA_FIELD_PARSE_ERROR();
        }
      }
      function parseZip64ExtendedInformation(data) {
        var size, compressedSize, offset, diskNumStart;
        if (data.length >= Constants.EF_ZIP64_SCOMP) {
          size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
          if (_centralHeader.size === Constants.EF_ZIP64_OR_32) {
            _centralHeader.size = size;
          }
        }
        if (data.length >= Constants.EF_ZIP64_RHO) {
          compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
          if (_centralHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
            _centralHeader.compressedSize = compressedSize;
          }
        }
        if (data.length >= Constants.EF_ZIP64_DSN) {
          offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
          if (_centralHeader.offset === Constants.EF_ZIP64_OR_32) {
            _centralHeader.offset = offset;
          }
        }
        if (data.length >= Constants.EF_ZIP64_DSN + 4) {
          diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
          if (_centralHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
            _centralHeader.diskNumStart = diskNumStart;
          }
        }
      }
      return {
        get entryName() {
          return decoder.decode(_entryName);
        },
        get rawEntryName() {
          return _entryName;
        },
        set entryName(val) {
          _entryName = Utils.toBuffer(val, decoder.encode);
          var lastChar = _entryName[_entryName.length - 1];
          _isDirectory = lastChar === 47 || lastChar === 92;
          _centralHeader.fileNameLength = _entryName.length;
        },
        get efs() {
          if (typeof _efs === "function") {
            return _efs(this.entryName);
          } else {
            return _efs;
          }
        },
        get extra() {
          return _extra;
        },
        set extra(val) {
          _extra = val;
          _centralHeader.extraLength = val.length;
          parseExtra(val);
        },
        get comment() {
          return decoder.decode(_comment);
        },
        set comment(val) {
          _comment = Utils.toBuffer(val, decoder.encode);
          _centralHeader.commentLength = _comment.length;
          if (_comment.length > 65535) throw Utils.Errors.COMMENT_TOO_LONG();
        },
        get name() {
          const n = decoder.decode(_entryName);
          return _isDirectory ? n.replace(/[/\\]$/, "").split("/").pop() : n.split("/").pop();
        },
        get isDirectory() {
          return _isDirectory;
        },
        getCompressedData: function() {
          return compress(false, null);
        },
        getCompressedDataAsync: function(callback) {
          compress(true, callback);
        },
        setData: function(value) {
          uncompressedData = Utils.toBuffer(value, Utils.decoder.encode);
          if (!_isDirectory && uncompressedData.length) {
            _centralHeader.size = uncompressedData.length;
            _centralHeader.method = Utils.Constants.DEFLATED;
            _centralHeader.crc = Utils.crc32(value);
            _centralHeader.changed = true;
          } else {
            _centralHeader.method = Utils.Constants.STORED;
          }
        },
        getData: function(pass) {
          if (_centralHeader.changed) {
            return uncompressedData;
          } else {
            return decompress(false, null, pass);
          }
        },
        getDataAsync: function(callback, pass) {
          if (_centralHeader.changed) {
            callback(uncompressedData);
          } else {
            decompress(true, callback, pass);
          }
        },
        set attr(attr) {
          _centralHeader.attr = attr;
        },
        get attr() {
          return _centralHeader.attr;
        },
        set header(data) {
          _centralHeader.loadFromBinary(data);
        },
        get header() {
          return _centralHeader;
        },
        packCentralHeader: function() {
          _centralHeader.flags_efs = this.efs;
          _centralHeader.extraLength = _extra.length;
          var header = _centralHeader.centralHeaderToBinary();
          var addpos = Utils.Constants.CENHDR;
          _entryName.copy(header, addpos);
          addpos += _entryName.length;
          _extra.copy(header, addpos);
          addpos += _centralHeader.extraLength;
          _comment.copy(header, addpos);
          return header;
        },
        packLocalHeader: function() {
          let addpos = 0;
          _centralHeader.flags_efs = this.efs;
          _centralHeader.extraLocalLength = _extralocal.length;
          const localHeaderBuf = _centralHeader.localHeaderToBinary();
          const localHeader = Buffer.alloc(localHeaderBuf.length + _entryName.length + _centralHeader.extraLocalLength);
          localHeaderBuf.copy(localHeader, addpos);
          addpos += localHeaderBuf.length;
          _entryName.copy(localHeader, addpos);
          addpos += _entryName.length;
          _extralocal.copy(localHeader, addpos);
          addpos += _extralocal.length;
          return localHeader;
        },
        toJSON: function() {
          const bytes = function(nr) {
            return "<" + (nr && nr.length + " bytes buffer" || "null") + ">";
          };
          return {
            entryName: this.entryName,
            name: this.name,
            comment: this.comment,
            isDirectory: this.isDirectory,
            header: _centralHeader.toJSON(),
            compressedData: bytes(input),
            data: bytes(uncompressedData)
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/zipFile.js
var require_zipFile = __commonJS({
  "node_modules/adm-zip/zipFile.js"(exports2, module2) {
    var ZipEntry = require_zipEntry();
    var Headers = require_headers();
    var Utils = require_util();
    module2.exports = function(inBuffer, options) {
      var entryList = [], entryTable = /* @__PURE__ */ Object.create(null), _comment = Buffer.alloc(0), mainHeader = new Headers.MainHeader(), loadedEntries = false;
      var password = null;
      const temporary = /* @__PURE__ */ new Set();
      const opts = options;
      const { noSort, decoder } = opts;
      if (inBuffer) {
        readMainHeader(opts.readEntries);
      } else {
        loadedEntries = true;
      }
      function makeTemporaryFolders() {
        const foldersList = /* @__PURE__ */ new Set();
        for (const elem of Object.keys(entryTable)) {
          const elements = elem.split("/");
          elements.pop();
          if (!elements.length) continue;
          for (let i = 0; i < elements.length; i++) {
            const sub = elements.slice(0, i + 1).join("/") + "/";
            foldersList.add(sub);
          }
        }
        for (const elem of foldersList) {
          if (!(elem in entryTable)) {
            const tempfolder = new ZipEntry(opts);
            tempfolder.entryName = elem;
            tempfolder.attr = 16;
            tempfolder.temporary = true;
            entryList.push(tempfolder);
            entryTable[tempfolder.entryName] = tempfolder;
            temporary.add(tempfolder);
          }
        }
      }
      function readEntries() {
        loadedEntries = true;
        entryTable = /* @__PURE__ */ Object.create(null);
        if (mainHeader.diskEntries > (inBuffer.length - mainHeader.offset) / Utils.Constants.CENHDR) {
          throw Utils.Errors.DISK_ENTRY_TOO_LARGE();
        }
        entryList = new Array(mainHeader.diskEntries);
        var index = mainHeader.offset;
        for (var i = 0; i < entryList.length; i++) {
          var tmp = index, entry = new ZipEntry(opts, inBuffer);
          entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
          entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
          if (entry.header.extraLength) {
            entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
          }
          if (entry.header.commentLength) entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
          index += entry.header.centralHeaderSize;
          entryList[i] = entry;
          entryTable[entry.entryName] = entry;
        }
        temporary.clear();
        makeTemporaryFolders();
      }
      function readMainHeader(readNow) {
        var i = inBuffer.length - Utils.Constants.ENDHDR, max = Math.max(0, i - 65535), n = max, endStart = inBuffer.length, endOffset = -1, commentEnd = 0;
        const trailingSpace = typeof opts.trailingSpace === "boolean" ? opts.trailingSpace : false;
        if (trailingSpace) max = 0;
        for (i; i >= n; i--) {
          if (inBuffer[i] !== 80) continue;
          if (inBuffer.readUInt32LE(i) === Utils.Constants.ENDSIG) {
            endOffset = i;
            commentEnd = i;
            endStart = i + Utils.Constants.ENDHDR;
            n = i - Utils.Constants.END64HDR;
            continue;
          }
          if (inBuffer.readUInt32LE(i) === Utils.Constants.END64SIG) {
            n = max;
            continue;
          }
          if (inBuffer.readUInt32LE(i) === Utils.Constants.ZIP64SIG) {
            endOffset = i;
            endStart = i + Utils.readBigUInt64LE(inBuffer, i + Utils.Constants.ZIP64SIZE) + Utils.Constants.ZIP64LEAD;
            break;
          }
        }
        if (endOffset == -1) throw Utils.Errors.INVALID_FORMAT();
        mainHeader.loadFromBinary(inBuffer.slice(endOffset, endStart));
        if (mainHeader.commentLength) {
          _comment = inBuffer.slice(commentEnd + Utils.Constants.ENDHDR);
        }
        if (readNow) readEntries();
      }
      function sortEntries() {
        if (entryList.length > 1 && !noSort) {
          entryList = entryList.map((entry) => ({ entry, key: entry.entryName.toLowerCase() })).sort((a, b) => a.key.localeCompare(b.key)).map((pair) => pair.entry);
        }
      }
      return {
        /**
         * Returns an array of ZipEntry objects existent in the current opened archive
         * @return Array
         */
        get entries() {
          if (!loadedEntries) {
            readEntries();
          }
          return entryList.filter((e) => !temporary.has(e));
        },
        /**
         * Archive comment
         * @return {String}
         */
        get comment() {
          return decoder.decode(_comment);
        },
        set comment(val) {
          _comment = Utils.toBuffer(val, decoder.encode);
          mainHeader.commentLength = _comment.length;
        },
        getEntryCount: function() {
          if (!loadedEntries) {
            return mainHeader.diskEntries;
          }
          return entryList.length;
        },
        forEach: function(callback) {
          this.entries.forEach(callback);
        },
        /**
         * Returns a reference to the entry with the given name or null if entry is inexistent
         *
         * @param entryName
         * @return ZipEntry
         */
        getEntry: function(entryName) {
          if (!loadedEntries) {
            readEntries();
          }
          return entryTable[entryName] || null;
        },
        /**
         * Adds the given entry to the entry list
         *
         * @param entry
         */
        setEntry: function(entry) {
          if (!loadedEntries) {
            readEntries();
          }
          entryList.push(entry);
          entryTable[entry.entryName] = entry;
          mainHeader.totalEntries = entryList.length;
        },
        /**
         * Removes the file with the given name from the entry list.
         *
         * If the entry is a directory, then all nested files and directories will be removed
         * @param entryName
         * @returns {void}
         */
        deleteFile: function(entryName, withsubfolders = true) {
          if (!loadedEntries) {
            readEntries();
          }
          const entry = entryTable[entryName];
          const list = this.getEntryChildren(entry, withsubfolders).map((child) => child.entryName);
          list.forEach(this.deleteEntry);
        },
        /**
         * Removes the entry with the given name from the entry list.
         *
         * @param {string} entryName
         * @returns {void}
         */
        deleteEntry: function(entryName) {
          if (!loadedEntries) {
            readEntries();
          }
          const entry = entryTable[entryName];
          const index = entryList.indexOf(entry);
          if (index >= 0) {
            entryList.splice(index, 1);
            delete entryTable[entryName];
            mainHeader.totalEntries = entryList.length;
          }
        },
        /**
         *  Iterates and returns all nested files and directories of the given entry
         *
         * @param entry
         * @return Array
         */
        getEntryChildren: function(entry, subfolders = true) {
          if (!loadedEntries) {
            readEntries();
          }
          if (typeof entry === "object") {
            if (entry.isDirectory && subfolders) {
              const list = [];
              const name = entry.entryName;
              for (const zipEntry of entryList) {
                if (zipEntry.entryName.startsWith(name)) {
                  list.push(zipEntry);
                }
              }
              return list;
            } else {
              return [entry];
            }
          }
          return [];
        },
        /**
         *  How many child elements entry has
         *
         * @param {ZipEntry} entry
         * @return {integer}
         */
        getChildCount: function(entry) {
          if (entry && entry.isDirectory) {
            const list = this.getEntryChildren(entry);
            return list.includes(entry) ? list.length - 1 : list.length;
          }
          return 0;
        },
        /**
         * Returns the zip file
         *
         * @return Buffer
         */
        compressToBuffer: function() {
          if (!loadedEntries) {
            readEntries();
          }
          sortEntries();
          const dataBlock = [];
          const headerBlocks = [];
          let totalSize = 0;
          let dindex = 0;
          mainHeader.size = 0;
          mainHeader.offset = 0;
          let totalEntries = 0;
          for (const entry of this.entries) {
            const compressedData = entry.getCompressedData();
            entry.header.offset = dindex;
            const localHeader = entry.packLocalHeader();
            const dataLength = localHeader.length + compressedData.length;
            dindex += dataLength;
            dataBlock.push(localHeader);
            dataBlock.push(compressedData);
            const centralHeader = entry.packCentralHeader();
            headerBlocks.push(centralHeader);
            mainHeader.size += centralHeader.length;
            totalSize += dataLength + centralHeader.length;
            totalEntries++;
          }
          totalSize += mainHeader.mainHeaderSize;
          mainHeader.offset = dindex;
          mainHeader.totalEntries = totalEntries;
          dindex = 0;
          const outBuffer = Buffer.alloc(totalSize);
          for (const content of dataBlock) {
            content.copy(outBuffer, dindex);
            dindex += content.length;
          }
          for (const content of headerBlocks) {
            content.copy(outBuffer, dindex);
            dindex += content.length;
          }
          const mh = mainHeader.toBinary();
          if (_comment) {
            _comment.copy(mh, mh.length - _comment.length);
          }
          mh.copy(outBuffer, dindex);
          inBuffer = outBuffer;
          loadedEntries = false;
          return outBuffer;
        },
        toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
          try {
            if (!loadedEntries) {
              readEntries();
            }
            sortEntries();
            const dataBlock = [];
            const centralHeaders = [];
            let totalSize = 0;
            let dindex = 0;
            let totalEntries = 0;
            mainHeader.size = 0;
            mainHeader.offset = 0;
            const compress2Buffer = function(entryLists) {
              if (entryLists.length > 0) {
                const entry = entryLists.shift();
                const name = entry.entryName + entry.extra.toString();
                if (onItemStart) onItemStart(name);
                entry.getCompressedDataAsync(function(compressedData) {
                  if (onItemEnd) onItemEnd(name);
                  entry.header.offset = dindex;
                  const localHeader = entry.packLocalHeader();
                  const dataLength = localHeader.length + compressedData.length;
                  dindex += dataLength;
                  dataBlock.push(localHeader);
                  dataBlock.push(compressedData);
                  const centalHeader = entry.packCentralHeader();
                  centralHeaders.push(centalHeader);
                  mainHeader.size += centalHeader.length;
                  totalSize += dataLength + centalHeader.length;
                  totalEntries++;
                  compress2Buffer(entryLists);
                });
              } else {
                totalSize += mainHeader.mainHeaderSize;
                mainHeader.offset = dindex;
                mainHeader.totalEntries = totalEntries;
                dindex = 0;
                const outBuffer = Buffer.alloc(totalSize);
                dataBlock.forEach(function(content) {
                  content.copy(outBuffer, dindex);
                  dindex += content.length;
                });
                centralHeaders.forEach(function(content) {
                  content.copy(outBuffer, dindex);
                  dindex += content.length;
                });
                const mh = mainHeader.toBinary();
                if (_comment) {
                  _comment.copy(mh, mh.length - _comment.length);
                }
                mh.copy(outBuffer, dindex);
                inBuffer = outBuffer;
                loadedEntries = false;
                onSuccess(outBuffer);
              }
            };
            compress2Buffer(Array.from(this.entries));
          } catch (e) {
            onFail(e);
          }
        }
      };
    };
  }
});

// node_modules/adm-zip/adm-zip.js
var require_adm_zip = __commonJS({
  "node_modules/adm-zip/adm-zip.js"(exports2, module2) {
    var Utils = require_util();
    var pth = require("path");
    var ZipEntry = require_zipEntry();
    var ZipFile = require_zipFile();
    var get_Bool = (...val) => Utils.findLast(val, (c) => typeof c === "boolean");
    var get_Str = (...val) => Utils.findLast(val, (c) => typeof c === "string");
    var get_Fun = (...val) => Utils.findLast(val, (c) => typeof c === "function");
    var defaultOptions = {
      // option "noSort" : if true it disables files sorting
      noSort: false,
      // read entries during load (initial loading may be slower)
      readEntries: false,
      // default method is none
      method: Utils.Constants.NONE,
      // file system
      fs: null
    };
    module2.exports = function(input, options) {
      let inBuffer = null;
      const opts = Object.assign(/* @__PURE__ */ Object.create(null), defaultOptions);
      if (input && "object" === typeof input) {
        if (!(input instanceof Uint8Array)) {
          Object.assign(opts, input);
          input = opts.input ? opts.input : void 0;
          if (opts.input) delete opts.input;
        }
        if (Buffer.isBuffer(input)) {
          inBuffer = input;
          opts.method = Utils.Constants.BUFFER;
          input = void 0;
        }
      }
      Object.assign(opts, options);
      const filetools = new Utils(opts);
      const applyDirAttributes = (dirEntries) => {
        dirEntries.filter((d) => d.attr).sort((a, b) => b.path.length - a.path.length).forEach((d) => filetools.fs.chmodSync(d.path, d.attr));
      };
      if (typeof opts.decoder !== "object" || typeof opts.decoder.encode !== "function" || typeof opts.decoder.decode !== "function") {
        opts.decoder = Utils.decoder;
      }
      if (input && "string" === typeof input) {
        if (filetools.fs.existsSync(input)) {
          opts.method = Utils.Constants.FILE;
          opts.filename = input;
          inBuffer = filetools.fs.readFileSync(input);
        } else {
          throw Utils.Errors.INVALID_FILENAME();
        }
      }
      const _zip = new ZipFile(inBuffer, opts);
      const { canonical, sanitize, zipnamefix } = Utils;
      function getEntry(entry) {
        if (entry && _zip) {
          var item;
          if (typeof entry === "string") item = _zip.getEntry(pth.posix.normalize(entry));
          if (typeof entry === "object" && typeof entry.entryName !== "undefined" && typeof entry.header !== "undefined") item = _zip.getEntry(entry.entryName);
          if (item) {
            return item;
          }
        }
        return null;
      }
      function fixPath(zipPath) {
        const { join: join6, normalize, sep } = pth.posix;
        return join6(pth.isAbsolute(zipPath) ? "/" : ".", normalize(sep + zipPath.split("\\").join(sep) + sep));
      }
      function filenameFilter(filterfn) {
        if (filterfn instanceof RegExp) {
          return /* @__PURE__ */ (function(rx) {
            return function(filename) {
              return rx.test(filename);
            };
          })(filterfn);
        } else if ("function" !== typeof filterfn) {
          return () => true;
        }
        return filterfn;
      }
      const relativePath = (local, entry) => {
        let lastChar = entry.slice(-1);
        lastChar = lastChar === filetools.sep ? filetools.sep : "";
        return pth.relative(local, entry) + lastChar;
      };
      return {
        /**
         * Extracts the given entry from the archive and returns the content as a Buffer object
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {Buffer|string} [pass] - password
         * @return Buffer or Null in case of error
         */
        readFile: function(entry, pass) {
          var item = getEntry(entry);
          return item && item.getData(pass) || null;
        },
        /**
         * Returns how many child elements has on entry (directories) on files it is always 0
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @returns {integer}
         */
        childCount: function(entry) {
          const item = getEntry(entry);
          if (item) {
            return _zip.getChildCount(item);
          }
        },
        /**
         * Asynchronous readFile
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {callback} callback
         *
         * @return Buffer or Null in case of error
         */
        readFileAsync: function(entry, callback) {
          var item = getEntry(entry);
          if (item) {
            item.getDataAsync(callback);
          } else {
            callback(null, "getEntry failed for:" + entry);
          }
        },
        /**
         * Extracts the given entry from the archive and returns the content as plain text in the given encoding
         * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
         * @param {string} encoding - Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsText: function(entry, encoding) {
          var item = getEntry(entry);
          if (item) {
            var data = item.getData();
            if (data && data.length) {
              return data.toString(encoding || "utf8");
            }
          }
          return "";
        },
        /**
         * Asynchronous readAsText
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {callback} callback
         * @param {string} [encoding] - Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsTextAsync: function(entry, callback, encoding) {
          var item = getEntry(entry);
          if (item) {
            item.getDataAsync(function(data, err) {
              if (err) {
                callback(data, err);
                return;
              }
              if (data && data.length) {
                callback(data.toString(encoding || "utf8"));
              } else {
                callback("");
              }
            });
          } else {
            callback("");
          }
        },
        /**
         * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
         *
         * @param {ZipEntry|string} entry
         * @param {boolean} withsubfolders
         * @returns {void}
         */
        deleteFile: function(entry, withsubfolders = true) {
          var item = getEntry(entry);
          if (item) {
            _zip.deleteFile(item.entryName, withsubfolders);
          }
        },
        /**
         * Remove the entry from the file or directory without affecting any nested entries
         *
         * @param {ZipEntry|string} entry
         * @returns {void}
         */
        deleteEntry: function(entry) {
          var item = getEntry(entry);
          if (item) {
            _zip.deleteEntry(item.entryName);
          }
        },
        /**
         * Adds a comment to the zip. The zip must be rewritten after adding the comment.
         *
         * @param {string} comment
         */
        addZipComment: function(comment) {
          _zip.comment = comment;
        },
        /**
         * Returns the zip comment
         *
         * @return String
         */
        getZipComment: function() {
          return _zip.comment || "";
        },
        /**
         * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
         * The comment cannot exceed 65535 characters in length
         *
         * @param {ZipEntry} entry
         * @param {string} comment
         */
        addZipEntryComment: function(entry, comment) {
          var item = getEntry(entry);
          if (item) {
            item.comment = comment;
          }
        },
        /**
         * Returns the comment of the specified entry
         *
         * @param {ZipEntry} entry
         * @return String
         */
        getZipEntryComment: function(entry) {
          var item = getEntry(entry);
          if (item) {
            return item.comment || "";
          }
          return "";
        },
        /**
         * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
         *
         * @param {ZipEntry} entry
         * @param {Buffer} content
         */
        updateFile: function(entry, content) {
          var item = getEntry(entry);
          if (item) {
            item.setData(content);
          }
        },
        /**
         * Adds a file from the disk to the archive
         *
         * @param {string} localPath File to add to zip
         * @param {string} [zipPath] Optional path inside the zip
         * @param {string} [zipName] Optional name for the file
         * @param {string} [comment] Optional file comment
         */
        addLocalFile: function(localPath, zipPath, zipName, comment) {
          if (filetools.fs.existsSync(localPath)) {
            zipPath = zipPath ? fixPath(zipPath) : "";
            const p = pth.win32.basename(pth.win32.normalize(localPath));
            zipPath += zipName ? zipName : p;
            const _attr = filetools.fs.statSync(localPath);
            const data = _attr.isFile() ? filetools.fs.readFileSync(localPath) : Buffer.alloc(0);
            if (_attr.isDirectory()) zipPath += filetools.sep;
            this.addFile(zipPath, data, comment, _attr);
          } else {
            throw Utils.Errors.FILE_NOT_FOUND(localPath);
          }
        },
        /**
         * Callback for showing if everything was done.
         *
         * @callback doneCallback
         * @param {Error} err - Error object
         * @param {boolean} done - was request fully completed
         */
        /**
         * Adds a file from the disk to the archive
         *
         * @param {(object|string)} options - options object, if it is string it us used as localPath.
         * @param {string} options.localPath - Local path to the file.
         * @param {string} [options.comment] - Optional file comment.
         * @param {string} [options.zipPath] - Optional path inside the zip
         * @param {string} [options.zipName] - Optional name for the file
         * @param {doneCallback} callback - The callback that handles the response.
         */
        addLocalFileAsync: function(options2, callback) {
          options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
          const localPath = pth.resolve(options2.localPath);
          const { comment } = options2;
          let { zipPath, zipName } = options2;
          const self = this;
          filetools.fs.stat(localPath, function(err, stats) {
            if (err) return callback(err, false);
            zipPath = zipPath ? fixPath(zipPath) : "";
            const p = pth.win32.basename(pth.win32.normalize(localPath));
            zipPath += zipName ? zipName : p;
            if (stats.isFile()) {
              filetools.fs.readFile(localPath, function(err2, data) {
                if (err2) return callback(err2, false);
                self.addFile(zipPath, data, comment, stats);
                return setImmediate(callback, void 0, true);
              });
            } else if (stats.isDirectory()) {
              zipPath += filetools.sep;
              self.addFile(zipPath, Buffer.alloc(0), comment, stats);
              return setImmediate(callback, void 0, true);
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {string} localPath - local path to the folder
         * @param {string} [zipPath] - optional path inside zip
         * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
         */
        addLocalFolder: function(localPath, zipPath, filter) {
          filter = filenameFilter(filter);
          zipPath = zipPath ? fixPath(zipPath) : "";
          localPath = pth.normalize(localPath);
          if (filetools.fs.existsSync(localPath)) {
            const items = filetools.findFiles(localPath);
            const self = this;
            if (items.length) {
              for (const filepath of items) {
                const p = pth.join(zipPath, relativePath(localPath, filepath));
                if (filter(p)) {
                  self.addLocalFile(filepath, pth.dirname(p));
                }
              }
            }
          } else {
            throw Utils.Errors.FILE_NOT_FOUND(localPath);
          }
        },
        /**
         * Asynchronous addLocalFolder
         * @param {string} localPath
         * @param {callback} callback
         * @param {string} [zipPath] optional path inside zip
         * @param {RegExp|function} [filter] optional RegExp or Function if files match will
         *               be included.
         */
        addLocalFolderAsync: function(localPath, callback, zipPath, filter) {
          filter = filenameFilter(filter);
          zipPath = zipPath ? fixPath(zipPath) : "";
          localPath = pth.normalize(localPath);
          var self = this;
          filetools.fs.open(localPath, "r", function(err) {
            if (err && err.code === "ENOENT") {
              callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
            } else if (err) {
              callback(void 0, err);
            } else {
              var items = filetools.findFiles(localPath);
              var i = -1;
              var next = function() {
                i += 1;
                if (i < items.length) {
                  var filepath = items[i];
                  var p = relativePath(localPath, filepath).split("\\").join("/");
                  p = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
                  if (filter(p)) {
                    filetools.fs.stat(filepath, function(er0, stats) {
                      if (er0) callback(void 0, er0);
                      if (stats.isFile()) {
                        filetools.fs.readFile(filepath, function(er1, data) {
                          if (er1) {
                            callback(void 0, er1);
                          } else {
                            self.addFile(zipPath + p, data, "", stats);
                            next();
                          }
                        });
                      } else {
                        self.addFile(zipPath + p + "/", Buffer.alloc(0), "", stats);
                        next();
                      }
                    });
                  } else {
                    process.nextTick(() => {
                      next();
                    });
                  }
                } else {
                  callback(true, void 0);
                }
              };
              next();
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {object | string} options - options object, if it is string it us used as localPath.
         * @param {string} options.localPath - Local path to the folder.
         * @param {string} [options.zipPath] - optional path inside zip.
         * @param {RegExp|function} [options.filter] - optional RegExp or Function if files match will be included.
         * @param {function|string} [options.namefix] - optional function to help fix filename
         * @param {doneCallback} callback - The callback that handles the response.
         *
         */
        addLocalFolderAsync2: function(options2, callback) {
          const self = this;
          options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
          const localPath = pth.resolve(fixPath(options2.localPath));
          let { zipPath, filter, namefix } = options2;
          if (filter instanceof RegExp) {
            filter = /* @__PURE__ */ (function(rx) {
              return function(filename) {
                return rx.test(filename);
              };
            })(filter);
          } else if ("function" !== typeof filter) {
            filter = function() {
              return true;
            };
          }
          zipPath = zipPath ? fixPath(zipPath) : "";
          if (namefix === "latin1") {
            namefix = (str2) => str2.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
          }
          if (typeof namefix !== "function") namefix = (str2) => str2;
          const relPathFix = (entry) => pth.join(zipPath, namefix(relativePath(localPath, entry)));
          const fileNameFix = (entry) => pth.win32.basename(pth.win32.normalize(namefix(entry)));
          filetools.fs.open(localPath, "r", function(err) {
            if (err && err.code === "ENOENT") {
              callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
            } else if (err) {
              callback(void 0, err);
            } else {
              filetools.findFilesAsync(localPath, function(err2, fileEntries) {
                if (err2) return callback(err2);
                fileEntries = fileEntries.filter((dir) => filter(relPathFix(dir)));
                if (!fileEntries.length) callback(void 0, false);
                setImmediate(
                  fileEntries.reverse().reduce(function(next, entry) {
                    return function(err3, done) {
                      if (err3 || done === false) return setImmediate(next, err3, false);
                      self.addLocalFileAsync(
                        {
                          localPath: entry,
                          zipPath: pth.dirname(relPathFix(entry)),
                          zipName: fileNameFix(entry)
                        },
                        next
                      );
                    };
                  }, callback)
                );
              });
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {string} localPath - path where files will be extracted
         * @param {object} props - optional properties
         * @param {string} [props.zipPath] - optional path inside zip
         * @param {RegExp|function} [props.filter] - optional RegExp or Function if files match will be included.
         * @param {function|string} [props.namefix] - optional function to help fix filename
         */
        addLocalFolderPromise: function(localPath, props) {
          return new Promise((resolve3, reject) => {
            this.addLocalFolderAsync2(Object.assign({ localPath }, props), (err, done) => {
              if (err) reject(err);
              if (done) resolve3(this);
            });
          });
        },
        /**
         * Allows you to create a entry (file or directory) in the zip file.
         * If you want to create a directory the entryName must end in / and a null buffer should be provided.
         * Comment and attributes are optional
         *
         * @param {string} entryName
         * @param {Buffer | string} content - file content as buffer or utf8 coded string
         * @param {string} [comment] - file comment
         * @param {number | object} [attr] - number as unix file permissions, object as filesystem Stats object
         */
        addFile: function(entryName, content, comment, attr) {
          entryName = zipnamefix(entryName);
          let entry = getEntry(entryName);
          const update = entry != null;
          if (!update) {
            entry = new ZipEntry(opts);
            entry.entryName = entryName;
          }
          entry.comment = comment || "";
          const isStat = "object" === typeof attr && attr instanceof filetools.fs.Stats;
          if (isStat) {
            entry.header.time = attr.mtime;
          }
          var fileattr = entry.isDirectory ? 16 : 0;
          let unix = entry.isDirectory ? 16384 : 32768;
          if (isStat) {
            unix |= 4095 & attr.mode;
          } else if ("number" === typeof attr) {
            unix |= 4095 & attr;
          } else {
            unix |= entry.isDirectory ? 493 : 420;
          }
          fileattr = (fileattr | unix << 16) >>> 0;
          entry.attr = fileattr;
          entry.setData(content);
          if (!update) _zip.setEntry(entry);
          return entry;
        },
        /**
         * Returns an array of ZipEntry objects representing the files and folders inside the archive
         *
         * @param {string} [password]
         * @returns Array
         */
        getEntries: function(password) {
          _zip.password = password;
          return _zip ? _zip.entries : [];
        },
        /**
         * Returns a ZipEntry object representing the file or folder specified by ``name``.
         *
         * @param {string} name
         * @return ZipEntry
         */
        getEntry: function(name) {
          return getEntry(name);
        },
        getEntryCount: function() {
          return _zip.getEntryCount();
        },
        forEach: function(callback) {
          return _zip.forEach(callback);
        },
        /**
         * Extracts the given entry to the given targetPath
         * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
         *
         * @param {string|ZipEntry} entry - ZipEntry object or String with the full path of the entry
         * @param {string} targetPath - Target folder where to write the file
         * @param {boolean} [maintainEntryPath=true] - If maintainEntryPath is true and the entry is inside a folder, the entry folder will be created in targetPath as well. Default is TRUE
         * @param {boolean} [overwrite=false] - If the file already exists at the target path, the file will be overwriten if this is true.
         * @param {boolean} [keepOriginalPermission=false] - The file will be set as the permission from the entry if this is true.
         * @param {string} [outFileName] - String If set will override the filename of the extracted file (Only works if the entry is a file)
         *
         * @return Boolean
         */
        extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite, keepOriginalPermission, outFileName) {
          overwrite = get_Bool(false, overwrite);
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          maintainEntryPath = get_Bool(true, maintainEntryPath);
          outFileName = get_Str(keepOriginalPermission, outFileName);
          var item = getEntry(entry);
          if (!item) {
            throw Utils.Errors.NO_ENTRY();
          }
          var entryName = canonical(item.entryName);
          var target = sanitize(targetPath, outFileName && !item.isDirectory ? canonical(outFileName) : maintainEntryPath ? entryName : pth.basename(entryName));
          if (item.isDirectory) {
            var children = _zip.getEntryChildren(item);
            children.forEach(function(child) {
              if (child.isDirectory) return;
              var content2 = child.getData();
              if (!content2) {
                throw Utils.Errors.CANT_EXTRACT_FILE();
              }
              var name = canonical(maintainEntryPath ? child.entryName : child.entryName.substring(item.entryName.length));
              var childName = sanitize(targetPath, name);
              const fileAttr2 = keepOriginalPermission ? child.header.fileAttr : void 0;
              filetools.writeFileTo(childName, content2, overwrite, fileAttr2);
            });
            return true;
          }
          var content = item.getData(_zip.password);
          if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
          if (filetools.fs.existsSync(target) && !overwrite) {
            throw Utils.Errors.CANT_OVERRIDE();
          }
          const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
          filetools.writeFileTo(target, content, overwrite, fileAttr);
          return true;
        },
        /**
         * Test the archive
         * @param {string} [pass]
         */
        test: function(pass) {
          if (!_zip) {
            return false;
          }
          for (var entry of _zip.entries) {
            try {
              if (entry.isDirectory) {
                continue;
              }
              var content = entry.getData(pass);
              if (!content) {
                return false;
              }
            } catch (err) {
              return false;
            }
          }
          return true;
        },
        /**
         * Extracts the entire archive to the given location
         *
         * @param {string} targetPath Target location
         * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
         *                  Default is FALSE
         * @param {string|Buffer} [pass] password
         */
        extractAllTo: function(targetPath, overwrite, keepOriginalPermission, pass) {
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          pass = get_Str(keepOriginalPermission, pass);
          overwrite = get_Bool(false, overwrite);
          if (!_zip) throw Utils.Errors.NO_ZIP();
          const dirEntries = [];
          _zip.entries.forEach(function(entry) {
            var entryName = sanitize(targetPath, canonical(entry.entryName));
            if (entry.isDirectory) {
              filetools.makeDir(entryName);
              if (keepOriginalPermission) dirEntries.push({ path: entryName, attr: entry.header.fileAttr });
              return;
            }
            var content = entry.getData(pass);
            if (!content) {
              throw Utils.Errors.CANT_EXTRACT_FILE();
            }
            const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
            filetools.writeFileTo(entryName, content, overwrite, fileAttr);
            try {
              filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
            } catch (err) {
            }
          });
          applyDirAttributes(dirEntries);
        },
        /**
         * Asynchronous extractAllTo
         *
         * @param {string} targetPath Target location
         * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
         *                  Default is FALSE
         * @param {function} callback The callback will be executed when all entries are extracted successfully or any error is thrown.
         */
        extractAllToAsync: function(targetPath, overwrite, keepOriginalPermission, callback) {
          callback = get_Fun(overwrite, keepOriginalPermission, callback);
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          overwrite = get_Bool(false, overwrite);
          if (!callback) {
            return new Promise((resolve3, reject) => {
              this.extractAllToAsync(targetPath, overwrite, keepOriginalPermission, function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve3(this);
                }
              });
            });
          }
          if (!_zip) {
            callback(Utils.Errors.NO_ZIP());
            return;
          }
          targetPath = pth.resolve(targetPath);
          const getPath = (entry) => sanitize(targetPath, pth.normalize(canonical(entry.entryName)));
          const getError = (msg, file) => new Error(msg + ': "' + file + '"');
          const dirEntries = [];
          const fileEntries = [];
          _zip.entries.forEach((e) => {
            if (e.isDirectory) {
              dirEntries.push(e);
            } else {
              fileEntries.push(e);
            }
          });
          const deferredDirAttr = [];
          for (const entry of dirEntries) {
            const dirPath = getPath(entry);
            const dirAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
            try {
              filetools.makeDir(dirPath);
            } catch (er) {
              callback(getError("Unable to create folder", dirPath));
              continue;
            }
            if (dirAttr) deferredDirAttr.push({ path: dirPath, attr: dirAttr });
            try {
              filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
            } catch (er) {
            }
          }
          const done = (err) => {
            if (!err) {
              try {
                applyDirAttributes(deferredDirAttr);
              } catch (er) {
                return callback(getError("Unable to set folder permissions", er.path || ""));
              }
            }
            callback(err);
          };
          fileEntries.reverse().reduce(function(next, entry) {
            return function(err) {
              if (err) {
                next(err);
              } else {
                const entryName = pth.normalize(canonical(entry.entryName));
                const filePath = sanitize(targetPath, entryName);
                entry.getDataAsync(function(content, err_1) {
                  if (err_1) {
                    next(err_1);
                  } else if (!content) {
                    next(Utils.Errors.CANT_EXTRACT_FILE());
                  } else {
                    const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
                    filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function(succ) {
                      if (!succ) {
                        return next(getError("Unable to write file", filePath));
                      }
                      filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function() {
                        next();
                      });
                    });
                  }
                });
              }
            };
          }, done)();
        },
        /**
         * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
         *
         * @param {string} targetFileName
         * @param {function} callback
         */
        writeZip: function(targetFileName, callback) {
          if (arguments.length === 1) {
            if (typeof targetFileName === "function") {
              callback = targetFileName;
              targetFileName = "";
            }
          }
          if (!targetFileName && opts.filename) {
            targetFileName = opts.filename;
          }
          if (!targetFileName) return;
          var zipData = _zip.compressToBuffer();
          if (zipData) {
            var ok = filetools.writeFileTo(targetFileName, zipData, true);
            if (typeof callback === "function") callback(!ok ? new Error("failed") : null, "");
          }
        },
        /**
                 *
                 * @param {string} targetFileName
                 * @param {object} [props]
                 * @param {boolean} [props.overwrite=true] If the file already exists at the target path, the file will be overwriten if this is true.
                 * @param {boolean} [props.perm] The file will be set as the permission from the entry if this is true.
        
                 * @returns {Promise<void>}
                 */
        writeZipPromise: function(targetFileName, props) {
          const { overwrite, perm } = Object.assign({ overwrite: true }, props);
          return new Promise((resolve3, reject) => {
            if (!targetFileName && opts.filename) targetFileName = opts.filename;
            if (!targetFileName) reject("ADM-ZIP: ZIP File Name Missing");
            this.toBufferPromise().then((zipData) => {
              const ret = (done) => done ? resolve3(done) : reject("ADM-ZIP: Wasn't able to write zip file");
              filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
            }, reject);
          });
        },
        /**
         * @returns {Promise<Buffer>} A promise to the Buffer.
         */
        toBufferPromise: function() {
          return new Promise((resolve3, reject) => {
            _zip.toAsyncBuffer(resolve3, reject);
          });
        },
        /**
         * Returns the content of the entire zip file as a Buffer object
         *
         * @prop {function} [onSuccess]
         * @prop {function} [onFail]
         * @prop {function} [onItemStart]
         * @prop {function} [onItemEnd]
         * @returns {Buffer}
         */
        toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
          if (typeof onSuccess === "function") {
            _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
            return null;
          }
          return _zip.compressToBuffer();
        }
      };
    };
  }
});

// src/queries.ts
function getOverview(db) {
  const lastRun = db.prepare("SELECT id, started_at, finished_at, status FROM sync_runs WHERE status <> 'running' ORDER BY id DESC LIMIT 1").get();
  const totals = db.prepare(
    `SELECT
        COUNT(*) AS total,
        SUM(is_active) AS active,
        SUM(CASE WHEN is_active = 1 AND plan = 'free' THEN 1 ELSE 0 END) AS active_free,
        SUM(CASE WHEN is_active = 1 AND plan <> 'free' THEN 1 ELSE 0 END) AS active_paid,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
      FROM subscribers`
  ).get();
  const byPlan = db.prepare("SELECT plan, COUNT(*) AS n FROM subscribers WHERE is_active = 1 GROUP BY plan ORDER BY n DESC").all();
  const window = (days) => db.prepare(
    `SELECT COUNT(*) AS new_subscribers FROM subscribers
         WHERE subscribed_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`
  ).get(`-${days} days`);
  const growth = (days) => db.prepare(
    `SELECT COALESCE(SUM(new_free),0) AS new_free, COALESCE(SUM(unsubscribes),0) AS unsubscribes,
                COALESCE(SUM(new_paid),0) AS new_paid, COALESCE(SUM(cancellations_finalized),0) AS cancellations
         FROM subscriber_growth_daily WHERE date >= date('now', ?)`
  ).get(`-${days} days`);
  const posts = db.prepare("SELECT COUNT(*) AS total, SUM(is_published) AS published FROM posts").get();
  const totalsSeries = db.prepare("SELECT date, total_subscribers FROM subscriber_totals ORDER BY date DESC LIMIT 1").get() ?? null;
  return {
    latest_total_from_series: totalsSeries,
    last_sync: lastRun ?? null,
    subscribers: totals,
    active_by_plan: byPlan,
    new_subscribers_from_list: { last_30d: window(30), last_90d: window(90) },
    growth_daily_totals: { last_30d: growth(30), last_90d: growth(90) },
    posts
  };
}
function listSubscribers(db, f) {
  const where = [];
  const args = [];
  if (f.plan) {
    if (f.plan === "paid") where.push("plan <> 'free'");
    else {
      where.push("plan = ?");
      args.push(f.plan);
    }
  }
  if (f.is_active !== void 0) {
    where.push("is_active = ?");
    args.push(f.is_active ? 1 : 0);
  }
  if (f.subscribed_after) {
    where.push("subscribed_at >= ?");
    args.push(f.subscribed_after);
  }
  if (f.subscribed_before) {
    where.push("subscribed_at < ?");
    args.push(f.subscribed_before);
  }
  if (f.email_contains) {
    where.push("email LIKE ?");
    args.push(`%${f.email_contains}%`);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 500);
  const offset = Math.max(f.offset ?? 0, 0);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM subscribers ${w}`).get(...args).n;
  const rows = db.prepare(
    `SELECT email, plan, is_active, subscribed_at, plan_since, unsubscribed_at, extra
       FROM subscribers ${w} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`
  ).all(...args, limit, offset).map(withExtra);
  return { total, limit, offset, rows };
}
function getSubscriber(db, email) {
  const sub = db.prepare("SELECT * FROM subscribers WHERE email = ?").get(email.trim().toLowerCase());
  if (!sub) return null;
  const history = db.prepare(
    `SELECT s.run_id, r.started_at AS synced_at, s.plan, s.is_active
       FROM subscriber_snapshots s JOIN sync_runs r ON r.id = s.run_id
       WHERE s.email = ? ORDER BY s.run_id`
  ).all(sub.email);
  return { ...withExtra(sub), history };
}
function findUpgradeCandidates(db, limit = 50, minDaysSubscribed = 14) {
  const rows = db.prepare(
    `SELECT email, subscribed_at, plan_since, source, extra,
              CAST(julianday('now') - julianday(subscribed_at) AS INTEGER) AS days_subscribed,
              json_extract(extra, '$.activity') AS activity,
              json_extract(extra, '$.emails_opened_30d') AS emails_opened_30d,
              json_extract(extra, '$.days_active_30d') AS days_active_30d,
              json_extract(extra, '$.post_views_30d') AS post_views_30d
       FROM subscribers
       WHERE is_active = 1 AND plan = 'free' AND subscribed_at IS NOT NULL
         AND julianday('now') - julianday(subscribed_at) >= ?
       ORDER BY
         COALESCE(json_extract(extra, '$.activity'), -1) DESC,
         COALESCE(json_extract(extra, '$.emails_opened_30d'), -1) DESC,
         COALESCE(json_extract(extra, '$.days_active_30d'), -1) DESC,
         subscribed_at ASC
       LIMIT ?`
  ).all(minDaysSubscribed, Math.min(Math.max(limit, 1), 500)).map(withExtra);
  const hasEngagement = rows.some((r) => r.activity !== null && r.activity !== void 0);
  return {
    method: hasEngagement ? "engagement real por contacto: activity (0-5), emails_opened_30d, days_active_30d; antig\xFCedad como desempate" : "PROXY: la BD no tiene engagement individual (export legado); ordenado por antig\xFCedad entre free activos",
    min_days_subscribed: minDaysSubscribed,
    count: rows.length,
    rows
  };
}
function getPostPerformance(db, sort = "post_date", limit = 50) {
  const col2 = { open_rate: "s.open_rate", views: "s.views", subscribes: "s.subscribes", signups: "s.signups", post_date: "s.post_date" }[sort];
  return db.prepare(
    `WITH latest AS (
         SELECT post_id, MAX(run_id) AS run_id FROM post_email_stats GROUP BY post_id
       )
       SELECT s.post_id, COALESCE(p.title, s.title) AS title, p.subtitle, s.post_date, p.type,
              COALESCE(p.audience, s.audience) AS audience, p.is_published,
              s.views, s.open_rate, s.engagement_rate, s.signups, s.subscribes, s.estimated_value
       FROM post_email_stats s
       JOIN latest l ON l.post_id = s.post_id AND l.run_id = s.run_id
       LEFT JOIN posts p ON p.post_id = s.post_id
       ORDER BY ${col2} DESC NULLS LAST
       LIMIT ?`
  ).all(Math.min(Math.max(limit, 1), 500));
}
function getGrowth(db, from, to, groupBy = "month") {
  const where = [];
  const args = [];
  if (from) {
    where.push("date >= ?");
    args.push(from);
  }
  if (to) {
    where.push("date <= ?");
    args.push(to);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const bucket = {
    day: "date",
    week: "strftime('%Y-W%W', date)",
    month: "substr(date, 1, 7)",
    source: "source"
  }[groupBy];
  const bySource = db.prepare(
    `SELECT ${bucket} AS bucket, ${groupBy === "source" ? "MAX(category)" : "'all'"} AS category,
              SUM(unique_visitors) AS unique_visitors, SUM(new_subscribers) AS new_subscribers, SUM(new_revenue) AS new_revenue
       FROM growth_sources ${w} GROUP BY bucket ORDER BY ${groupBy === "source" ? "new_subscribers DESC" : "bucket"}`
  ).all(...args);
  const daily = groupBy === "source" ? [] : db.prepare(
    `SELECT ${bucket} AS bucket, SUM(new_free) AS new_free, SUM(unsubscribes) AS unsubscribes,
                    SUM(new_paid) AS new_paid, SUM(upgrades) AS upgrades, SUM(cancellations_finalized) AS cancellations
             FROM subscriber_growth_daily ${w} GROUP BY bucket ORDER BY bucket`
  ).all(...args);
  return { group_by: groupBy, from: from ?? null, to: to ?? null, growth_sources: bySource, subscriber_growth: daily };
}
function getChurn(db, from, to) {
  const where = [];
  const args = [];
  if (from) {
    where.push("unsubscribed_at >= ?");
    args.push(from);
  }
  if (to) {
    where.push("unsubscribed_at <= ?");
    args.push(to);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "WHERE unsubscribed_at IS NOT NULL";
  const churned = db.prepare(`SELECT email, plan, subscribed_at, unsubscribed_at FROM subscribers ${w} ORDER BY unsubscribed_at DESC LIMIT 500`).all(...args);
  const transitions = db.prepare(
    `SELECT a.email, a.plan AS from_plan, b.plan AS to_plan, r.started_at AS changed_at
       FROM subscriber_snapshots a
       JOIN subscriber_snapshots b ON b.email = a.email
         AND b.run_id = (SELECT MIN(run_id) FROM subscriber_snapshots WHERE email = a.email AND run_id > a.run_id)
       JOIN sync_runs r ON r.id = b.run_id
       WHERE a.plan <> b.plan ${from ? "AND r.started_at >= ?" : ""} ${to ? "AND r.started_at <= ?" : ""}
       ORDER BY r.started_at DESC LIMIT 500`
  ).all(...[from, to].filter(Boolean));
  const summary = {
    churned: churned.length,
    upgrades: transitions.filter((t) => t.from_plan === "free" && t.to_plan !== "free" && t.to_plan !== "churned").length,
    downgrades: transitions.filter((t) => t.from_plan !== "free" && t.to_plan === "free").length
  };
  return { summary, churned, transitions };
}
function getSchema(db) {
  const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  const counts = Object.fromEntries(
    tables.map((t) => [t.name, db.prepare(`SELECT COUNT(*) AS n FROM ${t.name}`).get().n])
  );
  return { tables: tables.map((t) => ({ name: t.name, rows: counts[t.name], ddl: t.sql })) };
}
function stripLiterals(sql) {
  return sql.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""').replace(/`(?:[^`]|``)*`/g, "``").replace(/\[[^\]]*\]/g, "[]");
}
function querySql(db, sql, maxRows = 200) {
  const trimmed = sql.trim().replace(/;+$/, "");
  const bare = stripLiterals(trimmed);
  if (!/^\s*(select|with)\b/i.test(bare)) throw new Error("Solo se permiten sentencias SELECT / WITH.");
  if (FORBIDDEN.test(bare)) throw new Error("La consulta contiene palabras clave de escritura; solo lectura.");
  if (bare.includes(";")) throw new Error("Una sola sentencia por consulta.");
  const hasLimit = /\blimit\b/i.test(bare);
  const rows = db.prepare(hasLimit ? trimmed : `${trimmed} LIMIT ${maxRows}`).all();
  return { row_count: rows.length, truncated_at: hasLimit ? null : maxRows, rows };
}
function withExtra(row) {
  if (typeof row.extra === "string") {
    try {
      return { ...row, extra: JSON.parse(row.extra) };
    } catch {
      return row;
    }
  }
  return row;
}
function getNotesPerformance(db, sort = "interactions", limit = 50) {
  const order = {
    date: "n.date DESC",
    reactions: "n.reaction_count DESC, n.date DESC",
    restacks: "n.restacks DESC, n.date DESC",
    replies: "n.replies_count DESC, n.date DESC",
    interactions: "(n.reaction_count + n.restacks + n.replies_count) DESC, n.date DESC"
  }[sort];
  return db.prepare(
    `SELECT n.note_id, n.date, substr(n.body, 1, 200) AS excerpt, n.reaction_count AS likes, n.restacks, n.replies_count AS replies,
              (n.reaction_count + n.restacks + n.replies_count) AS interactions,
              (SELECT COUNT(DISTINCT actor_user_id) FROM note_interactions i WHERE i.note_id = n.note_id) AS unique_people,
              n.attachments, n.stats IS NOT NULL AS has_stats,
              'https://substack.com/@' || COALESCE((SELECT handle FROM note_actors WHERE user_id = n.user_id), '') || '/note/c-' || n.note_id AS url
       FROM notes n ORDER BY ${order} LIMIT ?`
  ).all(Math.min(Math.max(limit, 1), 500)).map((r) => ({ ...r, attachments: safeJson(r.attachments) }));
}
function getNoteEngagers(db, limit = 30, kind) {
  const where = kind ? "WHERE i.kind = ?" : "";
  const args = kind ? [kind] : [];
  return db.prepare(
    `SELECT a.user_id, a.name, a.handle, a.publication_subdomain, a.publication_name, a.is_following, a.is_subscribed,
              COUNT(*) AS interactions,
              SUM(i.kind = 'like') AS likes, SUM(i.kind = 'restack') AS restacks, SUM(i.kind = 'reply') AS replies,
              COUNT(DISTINCT i.note_id) AS notes_touched,
              MIN(n.date) AS first_interaction_note_date, MAX(n.date) AS last_interaction_note_date,
              (SELECT s.email FROM subscribers s WHERE s.is_active = 1 AND a.name IS NOT NULL
                 AND lower(json_extract(s.extra, '$.name')) = lower(a.name) LIMIT 1) AS matched_subscriber_email
       FROM note_interactions i
       JOIN note_actors a ON a.user_id = i.actor_user_id
       JOIN notes n ON n.note_id = i.note_id
       ${where}
       GROUP BY a.user_id
       ORDER BY interactions DESC, replies DESC, restacks DESC, likes DESC
       LIMIT ?`
  ).all(...args, Math.min(Math.max(limit, 1), 500));
}
function getNote(db, noteId) {
  const note = db.prepare("SELECT * FROM notes WHERE note_id = ?").get(noteId);
  if (!note) return null;
  const interactions = db.prepare(
    `SELECT i.kind, i.created_at, i.body, i.reaction_count, a.user_id, a.name, a.handle, a.publication_subdomain, a.is_following
       FROM note_interactions i JOIN note_actors a ON a.user_id = i.actor_user_id
       WHERE i.note_id = ? ORDER BY i.kind, i.created_at`
  ).all(noteId);
  return { ...note, attachments: safeJson(note.attachments), stats: safeJson(note.stats), interactions };
}
function safeJson(v) {
  if (typeof v !== "string") return v ?? null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}
function knownNotes(db) {
  const rows = db.prepare("SELECT note_id, reaction_count, restacks, replies_count, stats IS NOT NULL AS has_stats FROM notes").all();
  const counts = /* @__PURE__ */ new Map();
  const withStats = /* @__PURE__ */ new Set();
  for (const r of rows) {
    counts.set(r.note_id, {
      reaction_count: r.reaction_count,
      restacks: r.restacks,
      // En la BD se llama replies_count; en el feed, children_count.
      children_count: r.replies_count
    });
    if (r.has_stats) withStats.add(r.note_id);
  }
  return { counts, withStats };
}
var FORBIDDEN;
var init_queries = __esm({
  "src/queries.ts"() {
    "use strict";
    FORBIDDEN = /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|reindex|load_extension)\b|\breplace\s+into\b/i;
  }
});

// src/mcp/server.ts
var server_exports = {};
__export(server_exports, {
  buildServer: () => buildServer,
  serveStdio: () => serveStdio
});
function json(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 1) }] };
}
function safe(fn) {
  try {
    return json(fn());
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
  }
}
function buildServer(db) {
  const server = new import_mcp.McpServer({ name: "constack", version: "0.1.0" });
  server.registerTool(
    "get_overview",
    {
      title: "Resumen de la publicaci\xF3n",
      description: "Totales actuales de suscriptores (activos, free, pago, inactivos), reparto por plan, altas en 30/90 d\xEDas, totales diarios de crecimiento y fecha del \xFAltimo sync. Empieza por aqu\xED.",
      inputSchema: {}
    },
    async () => safe(() => getOverview(db))
  );
  server.registerTool(
    "list_subscribers",
    {
      title: "Listar suscriptores",
      description: "Lista contactos con filtros. plan: 'free', 'paid' (cualquier plan de pago), o uno concreto ('monthly','yearly','founding','comp'). Fechas en ISO (YYYY-MM-DD). Paginado con limit/offset.",
      inputSchema: {
        plan: import_zod.z.string().optional(),
        is_active: import_zod.z.boolean().optional(),
        subscribed_after: import_zod.z.string().optional(),
        subscribed_before: import_zod.z.string().optional(),
        email_contains: import_zod.z.string().optional(),
        limit: import_zod.z.number().int().min(1).max(500).optional(),
        offset: import_zod.z.number().int().min(0).optional()
      }
    },
    async (args) => safe(() => listSubscribers(db, args))
  );
  server.registerTool(
    "get_subscriber",
    {
      title: "Ficha de un suscriptor",
      description: "Devuelve el estado actual de un contacto por email y su historial de plan/actividad en cada sync.",
      inputSchema: { email: import_zod.z.string() }
    },
    async ({ email }) => safe(() => getSubscriber(db, email) ?? { error: "No existe ese email en la base." })
  );
  server.registerTool(
    "find_upgrade_candidates",
    {
      title: "Candidatos a pasar a pago",
      description: "Suscriptores free activos ordenados como candidatos a pago por engagement real del export de Substack: activity (0-5), emails abiertos en 30 d\xEDas y d\xEDas activos, con antig\xFCedad como desempate. Cada fila trae en `extra` el detalle (aperturas 7d/30d/6mo, clicks, vistas, \xFAltimo email abierto, fuente). Si la BD solo tuviera el export legado sin engagement, `method` lo indica y el orden pasa a ser por antig\xFCedad.",
      inputSchema: {
        limit: import_zod.z.number().int().min(1).max(500).optional(),
        min_days_subscribed: import_zod.z.number().int().min(0).optional()
      }
    },
    async ({ limit, min_days_subscribed }) => safe(() => findUpgradeCandidates(db, limit ?? 50, min_days_subscribed ?? 14))
  );
  server.registerTool(
    "get_post_performance",
    {
      title: "Rendimiento de posts",
      description: "Posts con sus m\xE9tricas de email m\xE1s recientes: views, open_rate, engagement_rate, signups (altas free generadas), subscribes (altas de pago generadas), estimated_value. \xDAtil para saber qu\xE9 contenido convierte.",
      inputSchema: {
        sort: import_zod.z.enum(["open_rate", "views", "subscribes", "signups", "post_date"]).optional(),
        limit: import_zod.z.number().int().min(1).max(500).optional()
      }
    },
    async ({ sort, limit }) => safe(() => getPostPerformance(db, sort ?? "post_date", limit ?? 50))
  );
  server.registerTool(
    "get_growth",
    {
      title: "Crecimiento por periodo y fuente",
      description: "Altas por fuente de captaci\xF3n (growth_sources) y series diarias de free/paid (new_free, unsubscribes, new_paid, upgrades, cancellations) agrupadas por day/week/month o por source. Fechas YYYY-MM-DD.",
      inputSchema: {
        from: import_zod.z.string().optional(),
        to: import_zod.z.string().optional(),
        group_by: import_zod.z.enum(["day", "week", "month", "source"]).optional()
      }
    },
    async ({ from, to, group_by }) => safe(() => getGrowth(db, from, to, group_by ?? "month"))
  );
  server.registerTool(
    "get_churn",
    {
      title: "Bajas y cambios de plan",
      description: "Contactos dados de baja (desaparecidos del export entre syncs) y transiciones de plan detectadas comparando snapshots consecutivos (upgrades free\u2192pago, downgrades pago\u2192free). Requiere al menos dos syncs para tener transiciones.",
      inputSchema: { from: import_zod.z.string().optional(), to: import_zod.z.string().optional() }
    },
    async ({ from, to }) => safe(() => getChurn(db, from, to))
  );
  server.registerTool(
    "get_notes_performance",
    {
      title: "Rendimiento de tus Notes",
      description: "Tus Notes (substack.com) con likes, restacks, respuestas, personas \xFAnicas que interactuaron y adjuntos. `has_stats` indica si Substack ya public\xF3 impresiones para esa nota (tarda ~24h).",
      inputSchema: {
        sort: import_zod.z.enum(["date", "reactions", "restacks", "replies", "interactions"]).optional(),
        limit: import_zod.z.number().int().min(1).max(500).optional()
      }
    },
    async ({ sort, limit }) => safe(() => getNotesPerformance(db, sort ?? "interactions", limit ?? 50))
  );
  server.registerTool(
    "get_note_engagers",
    {
      title: "Qui\xE9n interact\xFAa con tus Notes",
      description: "Personas ordenadas por interacciones con tus Notes (likes + restacks + respuestas), con su publicaci\xF3n, si te siguen, cu\xE1ntas notas tocaron y `matched_subscriber_email` si su nombre coincide con un suscriptor (pista, no certeza: Substack no revela el email de quien da like). Filtra por `kind` para ver solo qui\xE9n restackea o qui\xE9n responde.",
      inputSchema: {
        limit: import_zod.z.number().int().min(1).max(500).optional(),
        kind: import_zod.z.enum(["like", "restack", "reply"]).optional()
      }
    },
    async ({ limit, kind }) => safe(() => getNoteEngagers(db, limit ?? 30, kind))
  );
  server.registerTool(
    "get_note",
    {
      title: "Detalle de una Note",
      description: "Una Note con su texto completo, adjuntos, stats (si las hay) y la lista de qui\xE9n dio like, restacke\xF3 o respondi\xF3 (con el texto de cada respuesta).",
      inputSchema: { note_id: import_zod.z.number().int() }
    },
    async ({ note_id }) => safe(() => getNote(db, note_id) ?? { error: "No existe esa nota en la base." })
  );
  server.registerTool(
    "get_schema",
    {
      title: "Esquema de la base de datos",
      description: "Tablas, DDL y n\xFAmero de filas. \xDAsalo antes de query_sql para escribir consultas correctas.",
      inputSchema: {}
    },
    async () => safe(() => getSchema(db))
  );
  server.registerTool(
    "query_sql",
    {
      title: "Consulta SQL de solo lectura",
      description: "Ejecuta un SELECT (o WITH ... SELECT) sobre la base SQLite. Solo lectura, una sentencia, LIMIT 200 por defecto si no indicas uno. Para preguntas que las dem\xE1s tools no cubren.",
      inputSchema: { sql: import_zod.z.string(), max_rows: import_zod.z.number().int().min(1).max(2e3).optional() }
    },
    async ({ sql, max_rows }) => safe(() => querySql(db, sql, max_rows ?? 200))
  );
  return server;
}
async function serveStdio(db) {
  const server = buildServer(db);
  await server.connect(new import_stdio.StdioServerTransport());
}
var import_mcp, import_stdio, import_zod;
var init_server = __esm({
  "src/mcp/server.ts"() {
    "use strict";
    import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
    import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
    import_zod = require("zod");
    init_queries();
  }
});

// src/cli.ts
var import_node_util = require("node:util");
var import_node_path7 = require("node:path");
var import_node_fs8 = require("node:fs");

// src/db/index.ts
var import_node_sqlite = require("node:sqlite");
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// src/db/schema.ts
var SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  raw_dir TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS raw_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  row_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'substack',
  first_seen_at TEXT NOT NULL,
  subscribed_at TEXT,
  source TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_since TEXT,
  unsubscribed_at TEXT,
  last_synced_run_id INTEGER REFERENCES sync_runs(id),
  extra TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_subscribers_plan ON subscribers(plan, is_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed_at ON subscribers(subscribed_at);

CREATE TABLE IF NOT EXISTS subscriber_snapshots (
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  email TEXT NOT NULL,
  is_active INTEGER NOT NULL,
  plan TEXT NOT NULL,
  extra TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (run_id, email)
);

CREATE TABLE IF NOT EXISTS posts (
  post_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'substack',
  title TEXT,
  subtitle TEXT,
  post_date TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  email_sent_at TEXT,
  type TEXT,
  audience TEXT,
  slug TEXT,
  extra TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_posts_post_date ON posts(post_date);
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts(title);

CREATE TABLE IF NOT EXISTS post_email_stats (
  post_id TEXT NOT NULL,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  title TEXT,
  post_date TEXT,
  audience TEXT,
  views INTEGER,
  engagement_rate REAL,
  signups INTEGER,
  subscribes INTEGER,
  estimated_value REAL,
  open_rate REAL,
  extra TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (post_id, run_id)
);

CREATE TABLE IF NOT EXISTS growth_sources (
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  new_revenue REAL NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  PRIMARY KEY (date, source)
);

CREATE TABLE IF NOT EXISTS traffic (
  date TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

CREATE TABLE IF NOT EXISTS subscriber_totals (
  date TEXT PRIMARY KEY,
  total_subscribers INTEGER NOT NULL,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

CREATE TABLE IF NOT EXISTS notes (
  note_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT,
  body TEXT,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  restacks INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  attachments TEXT NOT NULL DEFAULT '[]',
  stats TEXT,
  stats_updated_at TEXT,
  last_synced_run_id INTEGER REFERENCES sync_runs(id)
);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);

CREATE TABLE IF NOT EXISTS note_actors (
  user_id INTEGER PRIMARY KEY,
  name TEXT,
  handle TEXT,
  photo_url TEXT,
  publication_subdomain TEXT,
  publication_name TEXT,
  is_subscribed INTEGER,
  is_following INTEGER,
  bestseller_tier INTEGER,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_interactions (
  note_id INTEGER NOT NULL REFERENCES notes(note_id),
  actor_user_id INTEGER NOT NULL REFERENCES note_actors(user_id),
  kind TEXT NOT NULL CHECK (kind IN ('like','restack','reply')),
  reply_id INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  body TEXT,
  reaction_count INTEGER,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  PRIMARY KEY (note_id, actor_user_id, kind, reply_id)
);
CREATE INDEX IF NOT EXISTS idx_note_interactions_actor ON note_interactions(actor_user_id);

CREATE TABLE IF NOT EXISTS subscriber_growth_daily (
  date TEXT PRIMARY KEY,
  new_free INTEGER,
  unsubscribes INTEGER,
  new_paid INTEGER,
  upgrades INTEGER,
  trials_started INTEGER,
  cancellations_initiated INTEGER,
  cancellations_finalized INTEGER,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);
`;

// src/db/index.ts
function openDb(path) {
  if (path !== ":memory:") (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(path), { recursive: true });
  const db = new import_node_sqlite.DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA_SQL);
  return db;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function startRun(db, rawDir2) {
  const r = db.prepare("INSERT INTO sync_runs (started_at, status, raw_dir) VALUES (?, 'running', ?)").run(nowIso(), rawDir2);
  return Number(r.lastInsertRowid);
}
function finishRun(db, runId, status, notes) {
  db.prepare("UPDATE sync_runs SET finished_at = ?, status = ?, notes = ? WHERE id = ?").run(
    nowIso(),
    status,
    notes ?? null,
    runId
  );
}

// src/load/index.ts
var import_node_fs3 = require("node:fs");
var import_node_crypto2 = require("node:crypto");
var import_node_path2 = require("node:path");
var import_node_os = require("node:os");
var import_adm_zip = __toESM(require_adm_zip(), 1);

// node_modules/csv-parse/lib/api/CsvError.js
var CsvError = class _CsvError extends Error {
  constructor(code, message, options, ...contexts) {
    if (Array.isArray(message)) message = message.join(" ").trim();
    super(message);
    if (Error.captureStackTrace !== void 0) {
      Error.captureStackTrace(this, _CsvError);
    }
    this.code = code;
    for (const context of contexts) {
      for (const key in context) {
        const value = context[key];
        this[key] = Buffer.isBuffer(value) ? value.toString(options.encoding) : value == null ? value : JSON.parse(JSON.stringify(value));
      }
    }
  }
};

// node_modules/csv-parse/lib/utils/is_object.js
var is_object = function(obj) {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
};

// node_modules/csv-parse/lib/api/normalize_columns_array.js
var normalize_columns_array = function(columns) {
  const normalizedColumns = [];
  for (let i = 0, l = columns.length; i < l; i++) {
    const column = columns[i];
    if (column === void 0 || column === null || column === false) {
      normalizedColumns[i] = { disabled: true };
    } else if (typeof column === "string" || typeof column === "number") {
      normalizedColumns[i] = { name: `${column}` };
    } else if (is_object(column)) {
      if (typeof column.name !== "string") {
        throw new CsvError("CSV_OPTION_COLUMNS_MISSING_NAME", [
          "Option columns missing name:",
          `property "name" is required at position ${i}`,
          "when column is an object literal"
        ]);
      }
      normalizedColumns[i] = column;
    } else {
      throw new CsvError("CSV_INVALID_COLUMN_DEFINITION", [
        "Invalid column definition:",
        "expect a string or a literal object,",
        `got ${JSON.stringify(column)} at position ${i}`
      ]);
    }
  }
  return normalizedColumns;
};

// node_modules/csv-parse/lib/utils/ResizeableBuffer.js
var ResizeableBuffer = class {
  constructor(size = 100) {
    this.size = size;
    this.length = 0;
    this.buf = Buffer.allocUnsafe(size);
  }
  prepend(val) {
    if (Buffer.isBuffer(val)) {
      const length = this.length + val.length;
      if (length >= this.size) {
        this.resize();
        if (length >= this.size) {
          throw Error("INVALID_BUFFER_STATE");
        }
      }
      const buf = this.buf;
      this.buf = Buffer.allocUnsafe(this.size);
      val.copy(this.buf, 0);
      buf.copy(this.buf, val.length);
      this.length += val.length;
    } else {
      const length = this.length++;
      if (length === this.size) {
        this.resize();
      }
      const buf = this.clone();
      this.buf[0] = val;
      buf.copy(this.buf, 1, 0, length);
    }
  }
  append(val) {
    const length = this.length++;
    if (length === this.size) {
      this.resize();
    }
    this.buf[length] = val;
  }
  clone() {
    return Buffer.from(this.buf.slice(0, this.length));
  }
  resize() {
    const length = this.length;
    this.size = this.size * 2;
    const buf = Buffer.allocUnsafe(this.size);
    this.buf.copy(buf, 0, 0, length);
    this.buf = buf;
  }
  toString(encoding) {
    if (encoding) {
      return this.buf.toString(encoding, 0, this.length);
    } else {
      return Uint8Array.prototype.slice.call(this.buf.slice(0, this.length));
    }
  }
  toJSON() {
    return this.toString("utf8");
  }
  reset() {
    this.length = 0;
  }
};
var ResizeableBuffer_default = ResizeableBuffer;

// node_modules/csv-parse/lib/api/init_state.js
var init_state = function(options) {
  const timchars = [
    // Basic Latin
    32,
    // [Space](https://www.fileformat.info/info/unicode/char/0020/index.htm)
    9,
    // [CHARACTER TABULATION (HT)](https://www.fileformat.info/info/unicode/char/0009/index.htm)
    10,
    // [LINE FEED (LF)](https://www.fileformat.info/info/unicode/char/000a/index.htm)
    13,
    // [CARRIAGE RETURN (CR)](https://www.fileformat.info/info/unicode/char/000d/index.htm)
    12,
    // [FORM FEED (FF)](https://www.fileformat.info/info/unicode/char/000c/index.htm)
    11,
    // [LINE TABULATION (VT)](https://www.fileformat.info/info/unicode/char/000b/index.htm)
    // Latin-1 Supplement
    160,
    // [NO-BREAK SPACE (NBSP)](https://www.fileformat.info/info/unicode/char/00a0/index.htm)
    // Ogham
    5760,
    // [OGHAM SPACE MARK](https://www.fileformat.info/info/unicode/char/1680/index.htm)
    // General Punctuation
    8192,
    // [EN QUAD](https://www.fileformat.info/info/unicode/char/2000/index.htm)
    8193,
    // [EM QUAD](https://www.fileformat.info/info/unicode/char/2001/index.htm)
    8194,
    // [EN SPACE](https://www.fileformat.info/info/unicode/char/2002/index.htm)
    8195,
    // [EM SPACE](https://www.fileformat.info/info/unicode/char/2003/index.htm)
    8196,
    // [THREE-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2004/index.htm)
    8197,
    // [FOUR-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2005/index.htm)
    8198,
    // [SIX-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2006/index.htm)
    8199,
    // [FIGURE SPACE](https://www.fileformat.info/info/unicode/char/2007/index.htm)
    8200,
    // [PUNCTUATION SPACE](https://www.fileformat.info/info/unicode/char/2008/index.htm)
    8201,
    // [THIN SPACE](https://www.fileformat.info/info/unicode/char/2009/index.htm)
    8202,
    // [HAIR SPACE](https://www.fileformat.info/info/unicode/char/200a/index.htm)
    8232,
    // [LINE SEPARATOR](https://www.fileformat.info/info/unicode/char/2028/index.htm)
    8233,
    // [PARAGRAPH SEPARATOR](https://www.fileformat.info/info/unicode/char/2029/index.htm)
    8239,
    // [NARROW NO-BREAK SPACE (NNBSP)](https://www.fileformat.info/info/unicode/char/202f/index.htm)
    8287,
    // [MEDIUM MATHEMATICAL SPACE (MMSP)](https://www.fileformat.info/info/unicode/char/205f/index.htm)
    12288,
    // [IDEOGRAPHIC SPACE](https://www.fileformat.info/info/unicode/char/3000/index.htm)
    65279
    // [ZERO WIDTH NO-BREAK SPACE (BOM)](https://www.fileformat.info/info/unicode/char/feff/index.htm)
  ].reduce((acc, codepoint) => {
    const encoded = Buffer.from(
      String.fromCharCode(codepoint),
      options.encoding
    );
    if (codepoint !== 63 && encoded.length === 1 && encoded[0] === 63) {
      return acc;
    }
    acc.push(encoded);
    return acc;
  }, []);
  const timcharFirstBytes = new Uint8Array(256);
  for (const t of timchars) timcharFirstBytes[t[0]] = 1;
  return {
    bomSkipped: false,
    bufBytesStart: 0,
    castField: options.cast_function,
    commenting: false,
    delimiterBufPrevious: void 0,
    delimiterDiscovered: false,
    // Current error encountered by a record
    error: void 0,
    enabled: options.from_line === 1,
    escaping: false,
    escapeIsQuote: Buffer.isBuffer(options.escape) && Buffer.isBuffer(options.quote) && Buffer.compare(options.escape, options.quote) === 0,
    // columns can be `false`, `true`, `Array`
    expectedRecordLength: Array.isArray(options.columns) ? options.columns.length : void 0,
    field: new ResizeableBuffer_default(20),
    firstLineToHeaders: options.cast_first_line_to_header,
    needMoreDataSize: Math.max(
      // Skip if the remaining buffer smaller than comment
      options.comment !== null ? options.comment.length : 0,
      ...options.delimiter ? options.delimiter.map((delimiter) => delimiter.length) : [],
      // Auto discovery of delimiter is limited to 1 character
      options.delimiter_auto ? 1 : 0,
      // Skip if the remaining buffer can be escape sequence
      options.quote !== null ? options.quote.length : 0,
      ...timchars.map((t) => t.length)
    ),
    previousBuf: void 0,
    quoting: false,
    stop: false,
    rawBuffer: new ResizeableBuffer_default(100),
    record: [],
    recordHasError: false,
    record_length: 0,
    recordDelimiterMaxLength: options.record_delimiter.length === 0 ? 0 : Math.max(...options.record_delimiter.map((v) => v.length)),
    trimChars: [
      Buffer.from(" ", options.encoding)[0],
      Buffer.from("	", options.encoding)[0]
    ],
    wasQuoting: false,
    wasRowDelimiter: false,
    timchars,
    timcharFirstBytes
  };
};

// node_modules/csv-parse/lib/utils/underscore.js
var underscore = function(str2) {
  return str2.replace(/([A-Z])/g, function(_, match) {
    return "_" + match.toLowerCase();
  });
};

// node_modules/csv-parse/lib/api/normalize_options.js
var normalize_options = function(opts) {
  const options = {};
  for (const opt in opts) {
    options[underscore(opt)] = opts[opt];
  }
  if (options.encoding === void 0 || options.encoding === true) {
    options.encoding = "utf8";
  } else if (options.encoding === null || options.encoding === false) {
    options.encoding = null;
  } else if (typeof options.encoding !== "string" && options.encoding !== null) {
    throw new CsvError(
      "CSV_INVALID_OPTION_ENCODING",
      [
        "Invalid option encoding:",
        "encoding must be a string or null to return a buffer,",
        `got ${JSON.stringify(options.encoding)}`
      ],
      options
    );
  }
  if (options.bom === void 0 || options.bom === null || options.bom === false) {
    options.bom = false;
  } else if (options.bom !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_BOM",
      [
        "Invalid option bom:",
        "bom must be true,",
        `got ${JSON.stringify(options.bom)}`
      ],
      options
    );
  }
  options.cast_function = null;
  if (options.cast === void 0 || options.cast === null || options.cast === false || options.cast === "") {
    options.cast = void 0;
  } else if (typeof options.cast === "function") {
    options.cast_function = options.cast;
    options.cast = true;
  } else if (options.cast !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_CAST",
      [
        "Invalid option cast:",
        "cast must be true or a function,",
        `got ${JSON.stringify(options.cast)}`
      ],
      options
    );
  }
  if (options.cast_date === void 0 || options.cast_date === null || options.cast_date === false || options.cast_date === "") {
    options.cast_date = false;
  } else if (options.cast_date === true) {
    options.cast_date = function(value) {
      const date = Date.parse(value);
      return !isNaN(date) ? new Date(date) : value;
    };
  } else if (typeof options.cast_date !== "function") {
    throw new CsvError(
      "CSV_INVALID_OPTION_CAST_DATE",
      [
        "Invalid option cast_date:",
        "cast_date must be true or a function,",
        `got ${JSON.stringify(options.cast_date)}`
      ],
      options
    );
  }
  options.cast_first_line_to_header = void 0;
  if (options.columns === true) {
    options.cast_first_line_to_header = void 0;
  } else if (typeof options.columns === "function") {
    options.cast_first_line_to_header = options.columns;
    options.columns = true;
  } else if (Array.isArray(options.columns)) {
    options.columns = normalize_columns_array(options.columns);
  } else if (options.columns === void 0 || options.columns === null || options.columns === false) {
    options.columns = false;
  } else {
    throw new CsvError(
      "CSV_INVALID_OPTION_COLUMNS",
      [
        "Invalid option columns:",
        "expect an array, a function or true,",
        `got ${JSON.stringify(options.columns)}`
      ],
      options
    );
  }
  if (options.group_columns_by_name === void 0 || options.group_columns_by_name === null || options.group_columns_by_name === false) {
    options.group_columns_by_name = false;
  } else if (options.group_columns_by_name !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
      [
        "Invalid option group_columns_by_name:",
        "expect an boolean,",
        `got ${JSON.stringify(options.group_columns_by_name)}`
      ],
      options
    );
  } else if (options.columns === false) {
    throw new CsvError(
      "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
      [
        "Invalid option group_columns_by_name:",
        "the `columns` mode must be activated."
      ],
      options
    );
  }
  if (options.comment === void 0 || options.comment === null || options.comment === false || options.comment === "") {
    options.comment = null;
  } else {
    if (typeof options.comment === "string") {
      options.comment = Buffer.from(options.comment, options.encoding);
    }
    if (!Buffer.isBuffer(options.comment)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_COMMENT",
        [
          "Invalid option comment:",
          "comment must be a buffer or a string,",
          `got ${JSON.stringify(options.comment)}`
        ],
        options
      );
    }
  }
  if (options.comment_no_infix === void 0 || options.comment_no_infix === null || options.comment_no_infix === false) {
    options.comment_no_infix = false;
  } else if (options.comment_no_infix !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_COMMENT",
      [
        "Invalid option comment_no_infix:",
        "value must be a boolean,",
        `got ${JSON.stringify(options.comment_no_infix)}`
      ],
      options
    );
  }
  if (options.delimiter_auto === void 0 || options.delimiter_auto === null || options.delimiter_auto === false) {
    options.delimiter_auto = false;
  } else if (options.delimiter_auto === true) {
    options.delimiter_auto = {};
  } else if (!is_object(options.delimiter_auto)) {
    throw new CsvError(
      "CSV_INVALID_OPTION_DELIMITER_AUTO",
      [
        "Invalid option delimiter_auto:",
        "delimiter_auto must be a boolean or a configuration object,",
        `got ${JSON.stringify(options.delimiter_auto)}`
      ],
      options
    );
  }
  if (options.delimiter_auto) {
    if (options.delimiter_auto.preferred === void 0)
      options.delimiter_auto.preferred = {
        [",".charCodeAt(0)]: 1.8,
        ["	".charCodeAt(0)]: 1.8,
        [";".charCodeAt(0)]: 1.6,
        [" ".charCodeAt(0)]: 1.6,
        [":".charCodeAt(0)]: 1.5,
        [".".charCodeAt(0)]: 1.4,
        ["/".charCodeAt(0)]: 1.4
      };
    else if (!is_object(options.delimiter_auto.preferred)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "preferred must be an object,",
          `got ${JSON.stringify(options.delimiter_auto.preferred)}`
        ],
        options
      );
    }
    if (options.delimiter_auto.score === void 0)
      options.delimiter_auto.score = (info, options2) => {
        return (info.total - info.std) * (options2.preferred[info.char_code] || 1);
      };
    else if (typeof options.delimiter_auto.score !== "function") {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "score must be a function,",
          `got ${JSON.stringify(options.delimiter_auto.score)}`
        ],
        options
      );
    }
    if (options.delimiter_auto.size === void 0)
      options.delimiter_auto.size = 2048;
    else if (typeof options.delimiter_auto.size !== "number") {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "size must be a number,",
          `got ${JSON.stringify(options.delimiter_auto.size)}`
        ],
        options
      );
    }
  }
  const delimiter_json = JSON.stringify(options.delimiter);
  if (options.delimiter_auto !== false) {
    options.delimiter = [];
  }
  if (!Array.isArray(options.delimiter)) {
    if (options.delimiter === void 0 || options.delimiter === null || options.delimiter === false) {
      options.delimiter = Buffer.from(",", options.encoding);
    }
    options.delimiter = [options.delimiter];
  }
  options.delimiter = options.delimiter.map(function(delimiter) {
    if (typeof delimiter === "string") {
      delimiter = Buffer.from(delimiter, options.encoding);
    }
    if (!Buffer.isBuffer(delimiter) || delimiter.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER",
        [
          "Invalid option delimiter:",
          "delimiter must be a non empty string or buffer or array of string|buffer,",
          `got ${delimiter_json}`
        ],
        options
      );
    }
    return delimiter;
  });
  if (options.escape === void 0 || options.escape === true) {
    options.escape = Buffer.from('"', options.encoding);
  } else if (typeof options.escape === "string") {
    options.escape = Buffer.from(options.escape, options.encoding);
  } else if (options.escape === null || options.escape === false) {
    options.escape = null;
  }
  if (options.escape !== null) {
    if (!Buffer.isBuffer(options.escape)) {
      throw new Error(
        `Invalid Option: escape must be a buffer, a string or a boolean, got ${JSON.stringify(options.escape)}`
      );
    }
  }
  if (options.from === void 0 || options.from === null) {
    options.from = 1;
  } else {
    if (typeof options.from === "string" && /\d+/.test(options.from)) {
      options.from = parseInt(options.from);
    }
    if (Number.isInteger(options.from)) {
      if (options.from < 0) {
        throw new Error(
          `Invalid Option: from must be a positive integer, got ${JSON.stringify(opts.from)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: from must be an integer, got ${JSON.stringify(options.from)}`
      );
    }
  }
  if (options.from_line === void 0 || options.from_line === null) {
    options.from_line = 1;
  } else {
    if (typeof options.from_line === "string" && /\d+/.test(options.from_line)) {
      options.from_line = parseInt(options.from_line);
    }
    if (Number.isInteger(options.from_line)) {
      if (options.from_line <= 0) {
        throw new Error(
          `Invalid Option: from_line must be a positive integer greater than 0, got ${JSON.stringify(opts.from_line)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: from_line must be an integer, got ${JSON.stringify(opts.from_line)}`
      );
    }
  }
  if (options.ignore_last_delimiters === void 0 || options.ignore_last_delimiters === null) {
    options.ignore_last_delimiters = false;
  } else if (typeof options.ignore_last_delimiters === "number") {
    options.ignore_last_delimiters = Math.floor(options.ignore_last_delimiters);
    if (options.ignore_last_delimiters === 0) {
      options.ignore_last_delimiters = false;
    }
  } else if (typeof options.ignore_last_delimiters !== "boolean") {
    throw new CsvError(
      "CSV_INVALID_OPTION_IGNORE_LAST_DELIMITERS",
      [
        "Invalid option `ignore_last_delimiters`:",
        "the value must be a boolean value or an integer,",
        `got ${JSON.stringify(options.ignore_last_delimiters)}`
      ],
      options
    );
  }
  if (options.ignore_last_delimiters === true && options.columns === false) {
    throw new CsvError(
      "CSV_IGNORE_LAST_DELIMITERS_REQUIRES_COLUMNS",
      [
        "The option `ignore_last_delimiters`",
        "requires the activation of the `columns` option"
      ],
      options
    );
  }
  if (options.info === void 0 || options.info === null || options.info === false) {
    options.info = false;
  } else if (options.info !== true) {
    throw new Error(
      `Invalid Option: info must be true, got ${JSON.stringify(options.info)}`
    );
  }
  if (options.max_record_size === void 0 || options.max_record_size === null || options.max_record_size === false) {
    options.max_record_size = 0;
  } else if (Number.isInteger(options.max_record_size) && options.max_record_size >= 0) {
  } else if (typeof options.max_record_size === "string" && /\d+/.test(options.max_record_size)) {
    options.max_record_size = parseInt(options.max_record_size);
  } else {
    throw new Error(
      `Invalid Option: max_record_size must be a positive integer, got ${JSON.stringify(options.max_record_size)}`
    );
  }
  if (options.objname === void 0 || options.objname === null || options.objname === false) {
    options.objname = void 0;
  } else if (Buffer.isBuffer(options.objname)) {
    if (options.objname.length === 0) {
      throw new Error(`Invalid Option: objname must be a non empty buffer`);
    }
    if (options.encoding === null) {
    } else {
      options.objname = options.objname.toString(options.encoding);
    }
  } else if (typeof options.objname === "string") {
    if (options.objname.length === 0) {
      throw new Error(`Invalid Option: objname must be a non empty string`);
    }
  } else if (typeof options.objname === "number") {
  } else {
    throw new Error(
      `Invalid Option: objname must be a string or a buffer, got ${options.objname}`
    );
  }
  if (options.objname !== void 0) {
    if (typeof options.objname === "number") {
      if (options.columns !== false) {
        throw Error(
          "Invalid Option: objname index cannot be combined with columns or be defined as a field"
        );
      }
    } else {
      if (options.columns === false) {
        throw Error(
          "Invalid Option: objname field must be combined with columns or be defined as an index"
        );
      }
    }
  }
  if (options.on_record === void 0 || options.on_record === null) {
    options.on_record = void 0;
  } else if (typeof options.on_record !== "function") {
    throw new CsvError(
      "CSV_INVALID_OPTION_ON_RECORD",
      [
        "Invalid option `on_record`:",
        "expect a function,",
        `got ${JSON.stringify(options.on_record)}`
      ],
      options
    );
  }
  if (options.on_skip !== void 0 && options.on_skip !== null && typeof options.on_skip !== "function") {
    throw new Error(
      `Invalid Option: on_skip must be a function, got ${JSON.stringify(options.on_skip)}`
    );
  }
  if (options.quote === null || options.quote === false || options.quote === "") {
    options.quote = null;
  } else {
    if (options.quote === void 0 || options.quote === true) {
      options.quote = Buffer.from('"', options.encoding);
    } else if (typeof options.quote === "string") {
      options.quote = Buffer.from(options.quote, options.encoding);
    }
    if (!Buffer.isBuffer(options.quote)) {
      throw new Error(
        `Invalid Option: quote must be a buffer or a string, got ${JSON.stringify(options.quote)}`
      );
    }
  }
  if (options.raw === void 0 || options.raw === null || options.raw === false) {
    options.raw = false;
  } else if (options.raw !== true) {
    throw new Error(
      `Invalid Option: raw must be true, got ${JSON.stringify(options.raw)}`
    );
  }
  if (options.record_delimiter === void 0) {
    options.record_delimiter = [];
  } else if (typeof options.record_delimiter === "string" || Buffer.isBuffer(options.record_delimiter)) {
    if (options.record_delimiter.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a non empty string or buffer,",
          `got ${JSON.stringify(options.record_delimiter)}`
        ],
        options
      );
    }
    options.record_delimiter = [options.record_delimiter];
  } else if (!Array.isArray(options.record_delimiter)) {
    throw new CsvError(
      "CSV_INVALID_OPTION_RECORD_DELIMITER",
      [
        "Invalid option `record_delimiter`:",
        "value must be a string, a buffer or array of string|buffer,",
        `got ${JSON.stringify(options.record_delimiter)}`
      ],
      options
    );
  }
  options.record_delimiter = options.record_delimiter.map(function(rd, i) {
    if (typeof rd !== "string" && !Buffer.isBuffer(rd)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a string, a buffer or array of string|buffer",
          `at index ${i},`,
          `got ${JSON.stringify(rd)}`
        ],
        options
      );
    } else if (rd.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a non empty string or buffer",
          `at index ${i},`,
          `got ${JSON.stringify(rd)}`
        ],
        options
      );
    }
    if (typeof rd === "string") {
      rd = Buffer.from(rd, options.encoding);
    }
    return rd;
  });
  if (typeof options.relax_column_count === "boolean") {
  } else if (options.relax_column_count === void 0 || options.relax_column_count === null) {
    options.relax_column_count = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count must be a boolean, got ${JSON.stringify(options.relax_column_count)}`
    );
  }
  if (typeof options.relax_column_count_less === "boolean") {
  } else if (options.relax_column_count_less === void 0 || options.relax_column_count_less === null) {
    options.relax_column_count_less = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count_less must be a boolean, got ${JSON.stringify(options.relax_column_count_less)}`
    );
  }
  if (typeof options.relax_column_count_more === "boolean") {
  } else if (options.relax_column_count_more === void 0 || options.relax_column_count_more === null) {
    options.relax_column_count_more = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count_more must be a boolean, got ${JSON.stringify(options.relax_column_count_more)}`
    );
  }
  if (typeof options.relax_quotes === "boolean") {
  } else if (options.relax_quotes === void 0 || options.relax_quotes === null) {
    options.relax_quotes = false;
  } else {
    throw new Error(
      `Invalid Option: relax_quotes must be a boolean, got ${JSON.stringify(options.relax_quotes)}`
    );
  }
  if (typeof options.skip_empty_lines === "boolean") {
  } else if (options.skip_empty_lines === void 0 || options.skip_empty_lines === null) {
    options.skip_empty_lines = false;
  } else {
    throw new Error(
      `Invalid Option: skip_empty_lines must be a boolean, got ${JSON.stringify(options.skip_empty_lines)}`
    );
  }
  if (typeof options.skip_records_with_empty_values === "boolean") {
  } else if (options.skip_records_with_empty_values === void 0 || options.skip_records_with_empty_values === null) {
    options.skip_records_with_empty_values = false;
  } else {
    throw new Error(
      `Invalid Option: skip_records_with_empty_values must be a boolean, got ${JSON.stringify(options.skip_records_with_empty_values)}`
    );
  }
  if (typeof options.skip_records_with_error === "boolean") {
  } else if (options.skip_records_with_error === void 0 || options.skip_records_with_error === null) {
    options.skip_records_with_error = false;
  } else {
    throw new Error(
      `Invalid Option: skip_records_with_error must be a boolean, got ${JSON.stringify(options.skip_records_with_error)}`
    );
  }
  if (options.rtrim === void 0 || options.rtrim === null || options.rtrim === false) {
    options.rtrim = false;
  } else if (options.rtrim !== true) {
    throw new Error(
      `Invalid Option: rtrim must be a boolean, got ${JSON.stringify(options.rtrim)}`
    );
  }
  if (options.ltrim === void 0 || options.ltrim === null || options.ltrim === false) {
    options.ltrim = false;
  } else if (options.ltrim !== true) {
    throw new Error(
      `Invalid Option: ltrim must be a boolean, got ${JSON.stringify(options.ltrim)}`
    );
  }
  if (options.trim === void 0 || options.trim === null || options.trim === false) {
    options.trim = false;
  } else if (options.trim !== true) {
    throw new Error(
      `Invalid Option: trim must be a boolean, got ${JSON.stringify(options.trim)}`
    );
  }
  if (options.trim === true && opts.ltrim !== false) {
    options.ltrim = true;
  } else if (options.ltrim !== true) {
    options.ltrim = false;
  }
  if (options.trim === true && opts.rtrim !== false) {
    options.rtrim = true;
  } else if (options.rtrim !== true) {
    options.rtrim = false;
  }
  if (options.to === void 0 || options.to === null) {
    options.to = -1;
  } else if (options.to !== -1) {
    if (typeof options.to === "string" && /\d+/.test(options.to)) {
      options.to = parseInt(options.to);
    }
    if (Number.isInteger(options.to)) {
      if (options.to <= 0) {
        throw new Error(
          `Invalid Option: to must be a positive integer greater than 0, got ${JSON.stringify(opts.to)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: to must be an integer, got ${JSON.stringify(opts.to)}`
      );
    }
  }
  if (options.to_line === void 0 || options.to_line === null) {
    options.to_line = -1;
  } else if (options.to_line !== -1) {
    if (typeof options.to_line === "string" && /\d+/.test(options.to_line)) {
      options.to_line = parseInt(options.to_line);
    }
    if (Number.isInteger(options.to_line)) {
      if (options.to_line <= 0) {
        throw new Error(
          `Invalid Option: to_line must be a positive integer greater than 0, got ${JSON.stringify(opts.to_line)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: to_line must be an integer, got ${JSON.stringify(opts.to_line)}`
      );
    }
  }
  return options;
};

// node_modules/csv-parse/lib/utils/delimiter_discover.js
var delimiter_discover = function(records, options) {
  if (!options) {
    ({ delimiter_auto: options } = normalize_options({ delimiter_auto: true }));
  }
  if (typeof records === "string") {
    records = Buffer.from(records);
  }
  if (Buffer.isBuffer(records)) {
    records = ((data) => {
      const records2 = [];
      const parser = transform({ delimiter: [] });
      const push = (record) => records2.push(record);
      const close = () => {
      };
      const error = parser.parse(data, true, push, close);
      if (error !== void 0) throw error;
      return records2;
    })(records);
  }
  const info = Array(127).fill().map(() => ({ lines: [] }));
  records.map(([record], line) => {
    for (let i = 0, l = record.length; i < l; i++) {
      const code = record.charCodeAt(i);
      if (info[code].lines[line] === void 0) info[code].lines[line] = 0;
      info[code].lines[line]++;
    }
  });
  info.map((info2, i) => {
    info2.char_code = i;
    info2.std = std(info2.lines);
    info2.total = info2.lines.reduce((acc, val) => acc + val, 0);
    info2.preferred = !!options.preferred[i];
    info2.score = options.score(info2, options);
  });
  const result = info.reduce(
    (acc, info2) => acc.score > info2.score ? acc : info2,
    {}
  );
  return String.fromCharCode(result.char_code);
};
var std = function(array) {
  const n = array.length;
  if (n === 0) return 0;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
};

// node_modules/csv-parse/lib/api/index.js
var isRecordEmpty = function(record) {
  return record.every(
    (field) => field == null || field.toString && field.toString().trim() === ""
  );
};
var cr = 13;
var nl = 10;
var boms = {
  // Note, the following are equals:
  // Buffer.from("\ufeff")
  // Buffer.from([239, 187, 191])
  // Buffer.from('EFBBBF', 'hex')
  utf8: Buffer.from([239, 187, 191]),
  // Note, the following are equals:
  // Buffer.from "\ufeff", 'utf16le
  // Buffer.from([255, 254])
  utf16le: Buffer.from([255, 254])
};
var transform = function(original_options = {}) {
  const info = {
    bytes: 0,
    bytes_records: 0,
    comment_lines: 0,
    empty_lines: 0,
    invalid_field_length: 0,
    lines: 1,
    records: 0
  };
  const options = normalize_options(original_options);
  return {
    info,
    original_options,
    options,
    state: init_state(options),
    __needMoreData: function(i, bufLen, end) {
      if (end) return false;
      const { encoding, escape, quote } = this.options;
      const { quoting, needMoreDataSize, recordDelimiterMaxLength } = this.state;
      const numOfCharLeft = bufLen - i - 1;
      const requiredLength = Math.max(
        needMoreDataSize,
        // Skip if the remaining buffer smaller than record delimiter
        // If "record_delimiter" is yet to be discovered:
        // 1. It is equals to `[]` and "recordDelimiterMaxLength" equals `0`
        // 2. We set the length to windows line ending in the current encoding
        // Note, that encoding is known from user or bom discovery at that point
        // recordDelimiterMaxLength,
        recordDelimiterMaxLength === 0 ? Buffer.from("\r\n", encoding).length : recordDelimiterMaxLength,
        // Skip if remaining buffer can be an escaped quote
        quoting ? (escape === null ? 0 : escape.length) + quote.length : 0,
        // Skip if remaining buffer can be record delimiter following the closing quote
        quoting ? quote.length + recordDelimiterMaxLength : 0
      );
      return numOfCharLeft < requiredLength;
    },
    // Central parser implementation
    parse: function(nextBuf, end, push, close) {
      const {
        bom,
        comment_no_infix,
        delimiter_auto,
        encoding,
        from_line,
        ltrim,
        max_record_size,
        raw,
        relax_quotes,
        rtrim,
        skip_empty_lines,
        to,
        to_line
      } = this.options;
      let { comment, escape, quote, record_delimiter } = this.options;
      const {
        bomSkipped,
        delimiterDiscovered,
        delimiterBufPrevious,
        rawBuffer,
        escapeIsQuote
      } = this.state;
      if (!delimiterDiscovered && delimiter_auto) {
        let delimiterBuf;
        if (delimiterBufPrevious === void 0) {
          delimiterBuf = nextBuf;
        } else if (delimiterBufPrevious !== void 0 && nextBuf === void 0) {
          delimiterBuf = delimiterBufPrevious;
        } else {
          delimiterBuf = Buffer.concat([delimiterBufPrevious, nextBuf]);
        }
        nextBuf = void 0;
        if (end || delimiterBuf.length > delimiter_auto.size) {
          this.options.delimiter = [
            Buffer.from(
              delimiter_discover(delimiterBuf, this.options.delimiter_auto)
            )
          ];
          this.state.previousBuf = delimiterBuf;
          this.state.delimiterBufPrevious = void 0;
          this.state.delimiterDiscovered = true;
        } else {
          this.state.delimiterBufPrevious = delimiterBuf;
          return;
        }
      }
      const { previousBuf } = this.state;
      let buf;
      if (previousBuf === void 0) {
        if (nextBuf === void 0) {
          close();
          return;
        } else {
          buf = nextBuf;
        }
      } else if (previousBuf !== void 0 && nextBuf === void 0) {
        buf = previousBuf;
      } else {
        buf = Buffer.concat([previousBuf, nextBuf]);
      }
      if (bomSkipped === false) {
        if (bom === false) {
          this.state.bomSkipped = true;
        } else if (buf.length < 3) {
          if (end === false) {
            this.state.previousBuf = buf;
            return;
          }
        } else {
          for (const encoding2 in boms) {
            if (boms[encoding2].compare(buf, 0, boms[encoding2].length) === 0) {
              const bomLength = boms[encoding2].length;
              this.state.bufBytesStart += bomLength;
              buf = buf.slice(bomLength);
              const options2 = normalize_options({
                ...this.original_options,
                encoding: encoding2
              });
              for (const key in options2) {
                this.options[key] = options2[key];
              }
              ({ comment, escape, quote } = this.options);
              break;
            }
          }
          this.state.bomSkipped = true;
        }
      }
      const bufLen = buf.length;
      let pos;
      for (pos = 0; pos < bufLen; pos++) {
        if (this.__needMoreData(pos, bufLen, end)) {
          break;
        }
        if (this.state.wasRowDelimiter === true) {
          this.info.lines++;
          this.state.wasRowDelimiter = false;
        }
        if (to_line !== -1 && this.info.lines > to_line) {
          this.state.stop = true;
          close();
          return;
        }
        if (this.state.quoting === false && record_delimiter.length === 0) {
          const record_delimiterCount = this.__autoDiscoverRecordDelimiter(
            buf,
            pos
          );
          if (record_delimiterCount) {
            record_delimiter = this.options.record_delimiter;
          }
        }
        const chr = buf[pos];
        if (raw === true) {
          rawBuffer.append(chr);
        }
        if ((chr === cr || chr === nl) && this.state.wasRowDelimiter === false) {
          this.state.wasRowDelimiter = true;
        }
        if (this.state.escaping === true) {
          this.state.escaping = false;
        } else {
          if (escape !== null && this.state.quoting === true && this.__isEscape(buf, pos, chr) && pos + escape.length < bufLen) {
            if (escapeIsQuote) {
              if (this.__isQuote(buf, pos + escape.length)) {
                this.state.escaping = true;
                pos += escape.length - 1;
                continue;
              }
            } else {
              this.state.escaping = true;
              pos += escape.length - 1;
              continue;
            }
          }
          if (this.state.commenting === false && this.__isQuote(buf, pos)) {
            if (this.state.quoting === true) {
              const nextChr = buf[pos + quote.length];
              const isNextChrTrimable = rtrim && this.__isCharTrimable(buf, pos + quote.length);
              const isNextChrComment = comment !== null && this.__compareBytes(comment, buf, pos + quote.length, nextChr);
              const isNextChrDelimiter = this.__isDelimiter(
                buf,
                pos + quote.length,
                nextChr
              );
              const isNextChrRecordDelimiter = record_delimiter.length === 0 ? this.__autoDiscoverRecordDelimiter(buf, pos + quote.length) : this.__isRecordDelimiter(nextChr, buf, pos + quote.length);
              if (escape !== null && this.__isEscape(buf, pos, chr) && this.__isQuote(buf, pos + escape.length)) {
                pos += escape.length - 1;
              } else if (!nextChr || isNextChrDelimiter || isNextChrRecordDelimiter || isNextChrComment || isNextChrTrimable) {
                this.state.quoting = false;
                this.state.wasQuoting = true;
                pos += quote.length - 1;
                continue;
              } else if (relax_quotes === false) {
                const err = this.__error(
                  new CsvError(
                    "CSV_INVALID_CLOSING_QUOTE",
                    [
                      "Invalid Closing Quote:",
                      `got "${String.fromCharCode(nextChr)}"`,
                      `at line ${this.info.lines}`,
                      "instead of delimiter, record delimiter, trimable character",
                      "(if activated) or comment"
                    ],
                    this.options,
                    this.__infoField()
                  )
                );
                if (err !== void 0) return err;
              } else {
                this.state.quoting = false;
                this.state.wasQuoting = true;
                this.state.field.prepend(quote);
                pos += quote.length - 1;
              }
            } else {
              if (this.state.field.length !== 0) {
                if (relax_quotes === false) {
                  const info2 = this.__infoField();
                  const bom2 = Object.keys(boms).map(
                    (b) => boms[b].equals(this.state.field.toString()) ? b : false
                  ).filter(Boolean)[0];
                  const err = this.__error(
                    new CsvError(
                      "INVALID_OPENING_QUOTE",
                      [
                        "Invalid Opening Quote:",
                        `a quote is found on field ${JSON.stringify(info2.column)} at line ${info2.lines}, value is ${JSON.stringify(this.state.field.toString(encoding))}`,
                        bom2 ? `(${bom2} bom)` : void 0
                      ],
                      this.options,
                      info2,
                      {
                        field: this.state.field
                      }
                    )
                  );
                  if (err !== void 0) return err;
                }
              } else {
                this.state.quoting = true;
                pos += quote.length - 1;
                continue;
              }
            }
          }
          if (this.state.quoting === false) {
            const recordDelimiterLength = this.__isRecordDelimiter(
              chr,
              buf,
              pos
            );
            if (recordDelimiterLength !== 0) {
              const skipCommentLine = this.state.commenting && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0;
              if (skipCommentLine) {
                this.info.comment_lines++;
              } else {
                if (this.state.enabled === false && this.info.lines + (this.state.wasRowDelimiter === true ? 1 : 0) >= from_line) {
                  this.state.enabled = true;
                  this.__resetField();
                  this.__resetRecord();
                  pos += recordDelimiterLength - 1;
                  continue;
                }
                if (skip_empty_lines === true && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0) {
                  this.info.empty_lines++;
                  pos += recordDelimiterLength - 1;
                  continue;
                }
                this.info.bytes = this.state.bufBytesStart + pos;
                const errField = this.__onField();
                if (errField !== void 0) return errField;
                this.info.bytes = this.state.bufBytesStart + pos + recordDelimiterLength;
                const errRecord = this.__onRecord(push);
                if (errRecord !== void 0) return errRecord;
                if (to !== -1 && this.info.records >= to) {
                  this.state.stop = true;
                  close();
                  return;
                }
              }
              this.state.commenting = false;
              pos += recordDelimiterLength - 1;
              continue;
            }
            if (this.state.commenting) {
              continue;
            }
            if (comment !== null && (comment_no_infix === false || this.state.record.length === 0 && this.state.field.length === 0)) {
              const commentCount = this.__compareBytes(comment, buf, pos, chr);
              if (commentCount !== 0) {
                this.state.commenting = true;
                continue;
              }
            }
            const delimiterLength = this.__isDelimiter(buf, pos, chr);
            if (delimiterLength !== 0) {
              this.info.bytes = this.state.bufBytesStart + pos;
              const errField = this.__onField();
              if (errField !== void 0) return errField;
              pos += delimiterLength - 1;
              continue;
            }
          }
        }
        if (this.state.commenting === false) {
          if (max_record_size !== 0 && this.state.record_length + this.state.field.length > max_record_size) {
            return this.__error(
              new CsvError(
                "CSV_MAX_RECORD_SIZE",
                [
                  "Max Record Size:",
                  "record exceed the maximum number of tolerated bytes",
                  `of ${max_record_size}`,
                  `at line ${this.info.lines}`
                ],
                this.options,
                this.__infoField()
              )
            );
          }
        }
        const lappend = ltrim === false || this.state.quoting === true || this.state.field.length !== 0 || !this.__isCharTrimable(buf, pos);
        const rappend = rtrim === false || this.state.wasQuoting === false;
        if (lappend === true && rappend === true) {
          this.state.field.append(chr);
        } else if (rtrim === true && !this.__isCharTrimable(buf, pos)) {
          return this.__error(
            new CsvError(
              "CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE",
              [
                "Invalid Closing Quote:",
                "found non trimable byte after quote",
                `at line ${this.info.lines}`
              ],
              this.options,
              this.__infoField()
            )
          );
        } else {
          if (lappend === false) {
            pos += this.__isCharTrimable(buf, pos) - 1;
          }
          continue;
        }
      }
      if (end === true) {
        if (this.state.quoting === true) {
          const err = this.__error(
            new CsvError(
              "CSV_QUOTE_NOT_CLOSED",
              [
                "Quote Not Closed:",
                `the parsing is finished with an opening quote at line ${this.info.lines}`
              ],
              this.options,
              this.__infoField()
            )
          );
          if (err !== void 0) return err;
        } else {
          if (this.state.wasQuoting === true || this.state.record.length !== 0 || this.state.field.length !== 0) {
            this.info.bytes = this.state.bufBytesStart + pos;
            const errField = this.__onField();
            if (errField !== void 0) return errField;
            const errRecord = this.__onRecord(push);
            if (errRecord !== void 0) return errRecord;
          } else if (this.state.wasRowDelimiter === true) {
            this.info.empty_lines++;
          } else if (this.state.commenting === true) {
            this.info.comment_lines++;
          }
        }
      } else {
        this.state.bufBytesStart += pos;
        this.state.previousBuf = buf.slice(pos);
      }
      if (this.state.wasRowDelimiter === true) {
        this.info.lines++;
        this.state.wasRowDelimiter = false;
      }
    },
    __onRecord: function(push) {
      const {
        columns,
        group_columns_by_name,
        encoding,
        info: info2,
        from,
        relax_column_count,
        relax_column_count_less,
        relax_column_count_more,
        raw,
        skip_records_with_empty_values
      } = this.options;
      const { enabled, record } = this.state;
      if (enabled === false) {
        return this.__resetRecord();
      }
      const recordLength = record.length;
      if (columns === true) {
        if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
          this.__resetRecord();
          return;
        }
        return this.__firstLineToColumns(record);
      }
      if (columns === false && this.info.records === 0) {
        this.state.expectedRecordLength = recordLength;
      }
      if (recordLength !== this.state.expectedRecordLength) {
        const err = columns === false ? new CsvError(
          "CSV_RECORD_INCONSISTENT_FIELDS_LENGTH",
          [
            "Invalid Record Length:",
            `expect ${this.state.expectedRecordLength},`,
            `got ${recordLength} on line ${this.info.lines}`
          ],
          this.options,
          this.__infoField(),
          {
            record
          }
        ) : new CsvError(
          "CSV_RECORD_INCONSISTENT_COLUMNS",
          [
            "Invalid Record Length:",
            `columns length is ${columns.length},`,
            // rename columns
            `got ${recordLength} on line ${this.info.lines}`
          ],
          this.options,
          this.__infoField(),
          {
            record
          }
        );
        if (relax_column_count === true || relax_column_count_less === true && recordLength < this.state.expectedRecordLength || relax_column_count_more === true && recordLength > this.state.expectedRecordLength) {
          this.info.invalid_field_length++;
          this.state.error = err;
        } else {
          const finalErr = this.__error(err);
          if (finalErr) return finalErr;
        }
      }
      if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
        this.__resetRecord();
        return;
      }
      if (this.state.recordHasError === true) {
        this.__resetRecord();
        this.state.recordHasError = false;
        return;
      }
      this.info.records++;
      if (from === 1 || this.info.records >= from) {
        const { objname } = this.options;
        if (columns !== false) {
          const obj = {};
          for (let i = 0, l = record.length; i < l; i++) {
            if (columns[i] === void 0 || columns[i].disabled) continue;
            if (group_columns_by_name === true && Object.hasOwn(obj, columns[i].name)) {
              if (Array.isArray(obj[columns[i].name])) {
                obj[columns[i].name] = obj[columns[i].name].concat(record[i]);
              } else {
                obj[columns[i].name] = [obj[columns[i].name], record[i]];
              }
            } else {
              Object.defineProperty(obj, columns[i].name, {
                value: record[i],
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
          }
          if (raw === true || info2 === true) {
            const extRecord = Object.assign(
              { record: obj },
              raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
              info2 === true ? { info: this.__infoRecord() } : {}
            );
            const err = this.__push(
              objname === void 0 ? extRecord : [obj[objname], extRecord],
              push
            );
            if (err) {
              return err;
            }
          } else {
            const err = this.__push(
              objname === void 0 ? obj : [obj[objname], obj],
              push
            );
            if (err) {
              return err;
            }
          }
        } else {
          if (raw === true || info2 === true) {
            const extRecord = Object.assign(
              { record },
              raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
              info2 === true ? { info: this.__infoRecord() } : {}
            );
            const err = this.__push(
              objname === void 0 ? extRecord : [record[objname], extRecord],
              push
            );
            if (err) {
              return err;
            }
          } else {
            const err = this.__push(
              objname === void 0 ? record : [record[objname], record],
              push
            );
            if (err) {
              return err;
            }
          }
        }
      }
      this.__resetRecord();
    },
    __firstLineToColumns: function(record) {
      const { firstLineToHeaders } = this.state;
      try {
        const headers = firstLineToHeaders === void 0 ? record : firstLineToHeaders.call(null, record);
        if (!Array.isArray(headers)) {
          return this.__error(
            new CsvError(
              "CSV_INVALID_COLUMN_MAPPING",
              [
                "Invalid Column Mapping:",
                "expect an array from column function,",
                `got ${JSON.stringify(headers)}`
              ],
              this.options,
              this.__infoField(),
              {
                headers
              }
            )
          );
        }
        const normalizedHeaders = normalize_columns_array(headers);
        this.state.expectedRecordLength = normalizedHeaders.length;
        this.options.columns = normalizedHeaders;
        this.__resetRecord();
        return;
      } catch (err) {
        return err;
      }
    },
    __resetRecord: function() {
      if (this.options.raw === true) {
        this.state.rawBuffer.reset();
      }
      this.state.error = void 0;
      this.state.record = [];
      this.state.record_length = 0;
    },
    __onField: function() {
      const { cast, encoding, rtrim, max_record_size } = this.options;
      const { enabled, wasQuoting } = this.state;
      if (enabled === false) {
        return this.__resetField();
      }
      let field = this.state.field.toString(encoding);
      if (rtrim === true && wasQuoting === false) {
        field = field.trimRight();
      }
      if (cast === true) {
        const [err, f] = this.__cast(field);
        if (err !== void 0) return err;
        field = f;
      }
      this.state.record.push(field);
      if (max_record_size !== 0 && typeof field === "string") {
        this.state.record_length += field.length;
      }
      this.__resetField();
    },
    __resetField: function() {
      this.state.field.reset();
      this.state.wasQuoting = false;
    },
    __push: function(record, push) {
      const { on_record } = this.options;
      if (on_record !== void 0) {
        const info2 = this.__infoRecord();
        try {
          record = on_record.call(null, record, info2);
        } catch (err) {
          return err;
        }
        if (record === void 0 || record === null) {
          return;
        }
      }
      this.info.bytes_records += this.info.bytes;
      push(record);
    },
    // Return a tuple with the error and the casted value
    __cast: function(field) {
      const { columns, relax_column_count } = this.options;
      const isColumns = Array.isArray(columns);
      if (isColumns === true && relax_column_count && this.options.columns.length <= this.state.record.length) {
        return [void 0, void 0];
      }
      if (this.state.castField !== null) {
        try {
          const info2 = this.__infoField();
          return [void 0, this.state.castField.call(null, field, info2)];
        } catch (err) {
          return [err];
        }
      }
      if (this.__isFloat(field)) {
        return [void 0, parseFloat(field)];
      } else if (this.options.cast_date !== false) {
        const info2 = this.__infoField();
        return [void 0, this.options.cast_date.call(null, field, info2)];
      }
      return [void 0, field];
    },
    __compareBytes: function(sourceBuf, targetBuf, targetPos, firstByte) {
      if (sourceBuf[0] !== firstByte) return 0;
      const sourceLength = sourceBuf.length;
      for (let i = 1; i < sourceLength; i++) {
        if (sourceBuf[i] !== targetBuf[targetPos + i]) return 0;
      }
      return sourceLength;
    },
    // Helper to test if a character is trimable
    __isCharTrimable: function(buf, pos) {
      const { timchars, timcharFirstBytes } = this.state;
      const first = buf[pos];
      if (first === void 0 || timcharFirstBytes[first] === 0) return 0;
      loop1: for (let i = 0; i < timchars.length; i++) {
        const timchar = timchars[i];
        for (let j = 0; j < timchar.length; j++) {
          if (timchar[j] !== buf[pos + j]) continue loop1;
        }
        return timchar.length;
      }
      return 0;
    },
    __isDelimiter: function(buf, pos, chr) {
      const { delimiter, ignore_last_delimiters } = this.options;
      if (ignore_last_delimiters === true && this.state.record.length === this.options.columns.length - 1) {
        return 0;
      } else if (ignore_last_delimiters !== false && typeof ignore_last_delimiters === "number" && this.state.record.length === ignore_last_delimiters - 1) {
        return 0;
      }
      loop1: for (let i = 0; i < delimiter.length; i++) {
        const del = delimiter[i];
        if (del[0] === chr) {
          for (let j = 1; j < del.length; j++) {
            if (del[j] !== buf[pos + j]) continue loop1;
          }
          return del.length;
        }
      }
      return 0;
    },
    __isEscape: function(buf, pos, chr) {
      const { escape } = this.options;
      if (escape === null) return false;
      const l = escape.length;
      if (escape[0] === chr) {
        for (let i = 0; i < l; i++) {
          if (escape[i] !== buf[pos + i]) {
            return false;
          }
        }
        return true;
      }
      return false;
    },
    __isFloat: function(value) {
      return value - parseFloat(value) + 1 >= 0;
    },
    // Keep it in case we implement the `cast_int` option
    // __isInt(value){
    //   // return Number.isInteger(parseInt(value))
    //   // return !isNaN( parseInt( obj ) );
    //   return /^(\-|\+)?[1-9][0-9]*$/.test(value)
    // }
    __isQuote: function(buf, pos) {
      const { quote } = this.options;
      if (quote === null) return false;
      const l = quote.length;
      for (let i = 0; i < l; i++) {
        if (quote[i] !== buf[pos + i]) {
          return false;
        }
      }
      return true;
    },
    __isRecordDelimiter: function(chr, buf, pos) {
      const { record_delimiter } = this.options;
      const recordDelimiterLength = record_delimiter.length;
      loop1: for (let i = 0; i < recordDelimiterLength; i++) {
        const rd = record_delimiter[i];
        const rdLength = rd.length;
        if (rd[0] !== chr) {
          continue;
        }
        for (let j = 1; j < rdLength; j++) {
          if (rd[j] !== buf[pos + j]) {
            continue loop1;
          }
        }
        return rd.length;
      }
      return 0;
    },
    __autoDiscoverRecordDelimiter: function(buf, pos) {
      const { encoding } = this.options;
      const rds = [
        // Important, the windows line ending must be before mac os 9
        Buffer.from("\r\n", encoding),
        Buffer.from("\n", encoding),
        Buffer.from("\r", encoding)
      ];
      loop: for (let i = 0; i < rds.length; i++) {
        const l = rds[i].length;
        for (let j = 0; j < l; j++) {
          if (rds[i][j] !== buf[pos + j]) {
            continue loop;
          }
        }
        this.options.record_delimiter.push(rds[i]);
        this.state.recordDelimiterMaxLength = rds[i].length;
        return rds[i].length;
      }
      return 0;
    },
    __error: function(msg) {
      const { encoding, raw, skip_records_with_error } = this.options;
      const err = typeof msg === "string" ? new Error(msg) : msg;
      if (skip_records_with_error) {
        this.state.recordHasError = true;
        if (this.options.on_skip !== void 0) {
          try {
            this.options.on_skip(
              err,
              raw ? this.state.rawBuffer.toString(encoding) : void 0
            );
          } catch (err2) {
            return err2;
          }
        }
        return void 0;
      } else {
        return err;
      }
    },
    __infoDataSet: function() {
      return {
        ...this.info,
        columns: this.options.columns
      };
    },
    __infoRecord: function() {
      const { columns, raw, encoding } = this.options;
      return {
        ...this.__infoDataSet(),
        bytes_records: this.info.bytes,
        error: this.state.error,
        header: columns === true,
        index: this.state.record.length,
        raw: raw ? this.state.rawBuffer.toString(encoding) : void 0
      };
    },
    __infoField: function() {
      const { columns } = this.options;
      const isColumns = Array.isArray(columns);
      const bytes_records = this.info.bytes_records;
      return {
        ...this.__infoRecord(),
        bytes_records,
        column: isColumns === true ? columns.length > this.state.record.length ? columns[this.state.record.length].name : null : this.state.record.length,
        quoting: this.state.wasQuoting
      };
    }
  };
};

// node_modules/csv-parse/lib/sync.js
var parse = function(data, opts = {}) {
  if (typeof data === "string") {
    data = Buffer.from(data);
  }
  const records = opts && opts.objname ? /* @__PURE__ */ Object.create(null) : [];
  const parser = transform(opts);
  const push = (record) => {
    if (parser.options.objname === void 0) records.push(record);
    else {
      records[record[0]] = record[1];
    }
  };
  const close = () => {
  };
  const error = parser.parse(data, true, push, close);
  if (error !== void 0) throw error;
  return records;
};

// src/load/csv.ts
var import_node_fs2 = require("node:fs");
var import_node_crypto = require("node:crypto");
var SIGNATURES = {
  email_stats: ["title", "post_date", "open_rate"],
  growth_sources: ["date", "source", "new subscribers"],
  traffic: ["date", "views"],
  posts: ["post_id", "post_date", "is_published"],
  free_subscriber_growth: ["date", "new_free"],
  paid_subscriber_growth: ["date", "new_paid"],
  subscriber_totals: ["date", "total_subscribers"]
};
var EMAIL_LIST_SIGNATURES = [
  ["email", "active_subscription", "created_at"],
  ["email", "type", "start date"]
];
function detectKind(headers) {
  const h = new Set(headers.map((x) => x.trim().toLowerCase()));
  if (h.size === 2 && h.has("date") && h.has("views")) return "traffic";
  if (EMAIL_LIST_SIGNATURES.some((sig) => sig.every((c) => h.has(c)))) return "email_list";
  for (const [kind, sig] of Object.entries(SIGNATURES)) {
    if (kind === "traffic") continue;
    if (sig.every((c) => h.has(c))) return kind;
  }
  return "unknown";
}
function readCsv(path) {
  const buf = (0, import_node_fs2.readFileSync)(path);
  const sha256 = (0, import_node_crypto.createHash)("sha256").update(buf).digest("hex");
  const text = buf.toString("utf8").replace(/^\uFEFF/, "");
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
  const headers = rows.length ? Object.keys(rows[0]) : firstLine(text);
  return { rows, headers, sha256 };
}
function firstLine(text) {
  return (text.split(/\r?\n/)[0] ?? "").split(",").map((s) => s.trim());
}
function normDate(v) {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
}
function toInt(v) {
  if (v === void 0 || v.trim() === "") return null;
  const n = Number(v.replace(/[,$]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function toNum(v) {
  if (v === void 0 || v.trim() === "") return null;
  const n = Number(v.replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function toBool(v) {
  return /^(true|1|yes|sí|si)$/i.test((v ?? "").trim());
}
function rest(row, used) {
  const u = new Set(used);
  const out = {};
  for (const [k, v] of Object.entries(row)) if (!u.has(k) && v !== "") out[k] = v;
  return JSON.stringify(out);
}

// src/load/subscriberRow.ts
var LEGACY_USED = ["email", "active_subscription", "plan", "email_disabled", "created_at", "first_payment_at", "expiry"];
function fromLegacy(row) {
  const active = toBool(row.active_subscription);
  const raw = (row.plan ?? "").trim().toLowerCase();
  const isActive = toBool(row.email_disabled) ? 0 : 1;
  let plan = "free";
  if (active) plan = raw === "" || raw === "other" ? "paid" : raw;
  else if (raw === "comp" || raw === "gift" || raw === "founding") plan = raw;
  return {
    email: row.email,
    createdAt: normDate(row.created_at),
    plan,
    isActive,
    paidSince: normDate(row.first_payment_at),
    unsubscribedAt: null,
    source: null,
    extra: pick(row, LEGACY_USED, { raw_plan: row.plan, expiry: row.expiry, first_payment_at: row.first_payment_at })
  };
}
function fromCurrent(row) {
  const type = (row["Type"] ?? "").trim().toLowerCase();
  const stripe = (row["Stripe plan"] ?? "").trim().toLowerCase();
  let plan;
  if (type === "" || type === "free") plan = "free";
  else if (type === "author" || type === "comp" || type === "gift" || type === "founding") plan = type;
  else if (/month/.test(stripe)) plan = "monthly";
  else if (/year|annual/.test(stripe)) plan = "yearly";
  else plan = type;
  const cancel = normDate(row["Cancel date"]);
  const paidSince = normDate(row["Paid upgrade date"]) ?? normDate(row["First paid date"]);
  const used = ["Email", "Type", "Stripe plan", "Cancel date", "Start date", "Paid upgrade date", "First paid date", "Subscription source (free)"];
  return {
    email: row["Email"],
    createdAt: normDate(row["Start date"]),
    plan,
    isActive: cancel ? 0 : 1,
    paidSince,
    unsubscribedAt: cancel,
    source: emptyToNull(row["Subscription source (free)"]),
    extra: pick(row, used, {
      name: emptyToNull(row["Name"]),
      raw_type: row["Type"],
      stripe_plan: emptyToNull(row["Stripe plan"]),
      activity: toInt(row["Activity"]),
      emails_received_6mo: toInt(row["Emails received (6mo)"]),
      emails_opened_6mo: toInt(row["Emails opened (6mo)"]),
      emails_opened_7d: toInt(row["Emails opened (7d)"]),
      emails_opened_30d: toInt(row["Emails opened (30d)"]),
      last_email_open: normDate(row["Last email open"]),
      links_clicked: toInt(row["Links clicked"]),
      last_clicked_at: normDate(row["Last clicked at"]),
      post_views: toInt(row["Post views"]),
      post_views_30d: toInt(row["Post views (30d)"]),
      comments: toInt(row["Comments"]),
      shares: toInt(row["Shares"]),
      days_active_30d: toInt(row["Days active (30d)"]),
      revenue: emptyToNull(row["Revenue"]),
      source_paid: emptyToNull(row["Subscription source (paid)"]),
      country: emptyToNull(row["Country"]),
      state: emptyToNull(row["State/Province"]),
      bestseller: emptyToNull(row["Bestseller"]),
      expiration_date: emptyToNull(row["Expiration date"])
    })
  };
}
function normalizeSubscriberRow(row) {
  const r = "active_subscription" in row ? fromLegacy(row) : "Email" in row ? fromCurrent(row) : null;
  if (!r) return null;
  r.email = (r.email ?? "").trim().toLowerCase();
  return r.email ? r : null;
}
function pick(row, used, known) {
  const out = {};
  for (const [k, v] of Object.entries(known)) if (v !== null && v !== void 0 && v !== "") out[k] = v;
  const consumed = /* @__PURE__ */ new Set([...used, ...KNOWN_SOURCE_COLUMNS]);
  for (const [k, v] of Object.entries(row)) if (!consumed.has(k) && v !== "") out[k] = v;
  return out;
}
var KNOWN_SOURCE_COLUMNS = [
  "Name",
  "Activity",
  "Emails received (6mo)",
  "Emails opened (6mo)",
  "Emails opened (7d)",
  "Emails opened (30d)",
  "Last email open",
  "Links clicked",
  "Last clicked at",
  "Post views",
  "Post views (30d)",
  "Comments",
  "Shares",
  "Days active (30d)",
  "Revenue",
  "Subscription source (paid)",
  "Country",
  "State/Province",
  "Bestseller",
  "Expiration date"
];
function emptyToNull(v) {
  const s = (v ?? "").trim();
  return s ? s : null;
}

// src/load/loaders.ts
function tx(db, fn) {
  db.exec("BEGIN");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
function loadEmailList(db, runId, rows) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const now = nowIso();
  const getSub = db.prepare("SELECT email, plan, plan_since FROM subscribers WHERE email = ?");
  const ins = db.prepare(`INSERT INTO subscribers
    (email, first_seen_at, subscribed_at, source, is_active, plan, plan_since, unsubscribed_at, last_synced_run_id, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const upd = db.prepare(`UPDATE subscribers SET subscribed_at = ?, source = COALESCE(?, source), is_active = ?, plan = ?, plan_since = ?,
    unsubscribed_at = ?, last_synced_run_id = ?, extra = ? WHERE email = ?`);
  const snap = db.prepare(
    "INSERT OR REPLACE INTO subscriber_snapshots (run_id, email, is_active, plan, extra) VALUES (?, ?, ?, ?, ?)"
  );
  return tx(db, () => {
    const seen = /* @__PURE__ */ new Set();
    for (const row of rows) {
      const r = normalizeSubscriberRow(row);
      if (!r) {
        res.skipped++;
        continue;
      }
      seen.add(r.email);
      const extra = JSON.stringify(r.extra);
      const prev = getSub.get(r.email);
      if (!prev) {
        const planSince = r.plan === "free" ? r.createdAt : r.paidSince ?? r.createdAt;
        ins.run(r.email, now, r.createdAt, r.source, r.isActive, r.plan, planSince, r.unsubscribedAt, runId, extra);
        res.inserted++;
      } else {
        const planSince = prev.plan === r.plan ? prev.plan_since : r.plan === "free" ? now : r.paidSince ?? now;
        upd.run(r.createdAt, r.source, r.isActive, r.plan, planSince, r.unsubscribedAt, runId, extra, r.email);
        res.updated++;
      }
      snap.run(runId, r.email, r.isActive, r.plan, extra);
    }
    const stale = db.prepare("SELECT email FROM subscribers WHERE is_active = 1 AND last_synced_run_id <> ?").all(runId);
    const gone = db.prepare(
      "UPDATE subscribers SET is_active = 0, unsubscribed_at = ?, last_synced_run_id = ? WHERE email = ?"
    );
    const goneSnap = db.prepare(
      "INSERT OR REPLACE INTO subscriber_snapshots (run_id, email, is_active, plan, extra) VALUES (?, ?, 0, 'churned', '{}')"
    );
    for (const { email } of stale) {
      if (seen.has(email)) continue;
      gone.run(now, runId, email);
      goneSnap.run(runId, email);
      res.updated++;
    }
    return res;
  });
}
function loadPosts(db, _runId, rows) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare(`INSERT INTO posts (post_id, title, subtitle, post_date, is_published, email_sent_at, type, audience, slug, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(post_id) DO UPDATE SET title=excluded.title, subtitle=excluded.subtitle, post_date=excluded.post_date,
      is_published=excluded.is_published, email_sent_at=excluded.email_sent_at, type=excluded.type, audience=excluded.audience,
      slug=excluded.slug, extra=excluded.extra`);
  const used = ["post_id", "title", "subtitle", "post_date", "is_published", "email_sent_at", "type", "audience"];
  return tx(db, () => {
    for (const row of rows) {
      const id = (row.post_id ?? "").trim();
      if (!id) {
        res.skipped++;
        continue;
      }
      const slug = id.includes(".") ? id.slice(id.indexOf(".") + 1) : null;
      stmt.run(
        id,
        row.title ?? null,
        row.subtitle ?? null,
        normDate(row.post_date),
        toBool(row.is_published) ? 1 : 0,
        normDate(row.email_sent_at),
        row.type ?? null,
        row.audience ?? null,
        slug,
        rest(row, used)
      );
      res.inserted++;
    }
    return res;
  });
}
function resolvePostId(db, title, postDate) {
  if (postDate) {
    const byDate = db.prepare("SELECT post_id FROM posts WHERE post_date = ?").get(postDate);
    if (byDate) return byDate.post_id;
  }
  const byTitle = db.prepare("SELECT post_id FROM posts WHERE title = ? ORDER BY post_date DESC LIMIT 1").get(title);
  if (byTitle) return byTitle.post_id;
  return "title:" + title;
}
function loadEmailStats(db, runId, rows) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare(`INSERT OR REPLACE INTO post_email_stats
    (post_id, run_id, title, post_date, audience, views, engagement_rate, signups, subscribes, estimated_value, open_rate, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const used = ["title", "post_date", "audience", "views", "engagement_rate", "signups", "subscribes", "estimated_value", "open_rate"];
  return tx(db, () => {
    for (const row of rows) {
      const title = (row.title ?? "").trim();
      if (!title) {
        res.skipped++;
        continue;
      }
      const postDate = normDate(row.post_date);
      stmt.run(
        resolvePostId(db, title, postDate),
        runId,
        title,
        postDate,
        row.audience ?? null,
        toInt(row.views),
        toNum(row.engagement_rate),
        toInt(row.signups),
        toInt(row.subscribes),
        toNum(row.estimated_value),
        toNum(row.open_rate),
        rest(row, used)
      );
      res.inserted++;
    }
    return res;
  });
}
function col(row, name) {
  const want = name.toLowerCase().replace(/[\s_]+/g, "");
  for (const [k, v] of Object.entries(row)) if (k.toLowerCase().replace(/[\s_]+/g, "") === want) return v;
  return void 0;
}
function loadGrowthSources(db, runId, rows) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare(`INSERT OR REPLACE INTO growth_sources
    (date, source, category, unique_visitors, new_subscribers, new_revenue, run_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      const source = (col(row, "source") ?? "").trim();
      if (!date || !source) {
        res.skipped++;
        continue;
      }
      stmt.run(
        date,
        source,
        col(row, "category") ?? null,
        toInt(col(row, "unique visitors")) ?? 0,
        toInt(col(row, "new subscribers")) ?? 0,
        toNum(col(row, "new revenue")) ?? 0,
        runId
      );
      res.inserted++;
    }
    return res;
  });
}
function loadTraffic(db, runId, rows) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare("INSERT OR REPLACE INTO traffic (date, views, run_id) VALUES (?, ?, ?)");
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      if (!date) {
        res.skipped++;
        continue;
      }
      stmt.run(date, toInt(col(row, "views")) ?? 0, runId);
      res.inserted++;
    }
    return res;
  });
}
function loadSubscriberGrowth(db, runId, rows, kind) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const freeStmt = db.prepare(`INSERT INTO subscriber_growth_daily (date, new_free, unsubscribes, run_id) VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET new_free=excluded.new_free, unsubscribes=excluded.unsubscribes, run_id=excluded.run_id`);
  const paidStmt = db.prepare(`INSERT INTO subscriber_growth_daily
    (date, new_paid, upgrades, trials_started, cancellations_initiated, cancellations_finalized, run_id) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET new_paid=excluded.new_paid, upgrades=excluded.upgrades, trials_started=excluded.trials_started,
      cancellations_initiated=excluded.cancellations_initiated, cancellations_finalized=excluded.cancellations_finalized, run_id=excluded.run_id`);
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      if (!date) {
        res.skipped++;
        continue;
      }
      if (kind === "free") freeStmt.run(date, toInt(row.new_free), toInt(row.unsubscribes), runId);
      else
        paidStmt.run(
          date,
          toInt(row.new_paid),
          toInt(row.upgrades),
          toInt(row.trials_started),
          toInt(row.cancellations_initiated),
          toInt(row.cancellations_finalized),
          runId
        );
      res.inserted++;
    }
    return res;
  });
}
function loadSubscriberTotals(db, runId, rows) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare("INSERT OR REPLACE INTO subscriber_totals (date, total_subscribers, run_id) VALUES (?, ?, ?)");
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      const total = toInt(col(row, "total_subscribers"));
      if (!date || total === null) {
        res.skipped++;
        continue;
      }
      stmt.run(date, total, runId);
      res.inserted++;
    }
    return res;
  });
}

// src/load/notes.ts
function loadNotes(db, runId, bundle) {
  const res = { inserted: 0, updated: 0, skipped: 0 };
  const now = nowIso();
  const upNote = db.prepare(`INSERT INTO notes
      (note_id, user_id, date, body, reaction_count, restacks, replies_count, attachments, stats, stats_updated_at, last_synced_run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(note_id) DO UPDATE SET date=excluded.date, body=excluded.body, reaction_count=excluded.reaction_count,
      restacks=excluded.restacks, replies_count=excluded.replies_count, attachments=excluded.attachments,
      stats=COALESCE(excluded.stats, notes.stats), stats_updated_at=COALESCE(excluded.stats_updated_at, notes.stats_updated_at),
      last_synced_run_id=excluded.last_synced_run_id`);
  const upActor = db.prepare(`INSERT INTO note_actors
      (user_id, name, handle, photo_url, publication_subdomain, publication_name, is_subscribed, is_following, bestseller_tier, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET name=COALESCE(excluded.name, note_actors.name), handle=COALESCE(excluded.handle, note_actors.handle),
      photo_url=COALESCE(excluded.photo_url, note_actors.photo_url),
      publication_subdomain=COALESCE(excluded.publication_subdomain, note_actors.publication_subdomain),
      publication_name=COALESCE(excluded.publication_name, note_actors.publication_name),
      is_subscribed=COALESCE(excluded.is_subscribed, note_actors.is_subscribed),
      is_following=COALESCE(excluded.is_following, note_actors.is_following),
      bestseller_tier=COALESCE(excluded.bestseller_tier, note_actors.bestseller_tier), last_seen_at=excluded.last_seen_at`);
  const delInter = db.prepare("DELETE FROM note_interactions WHERE note_id = ?");
  const insInter = db.prepare(`INSERT OR REPLACE INTO note_interactions
      (note_id, actor_user_id, kind, reply_id, created_at, body, reaction_count, run_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const exists = db.prepare("SELECT 1 FROM notes WHERE note_id = ?");
  const valid = (a) => !!a && Number.isFinite(a.id) && a.id > 0;
  const actor = (a) => {
    upActor.run(a.id, a.name, a.handle, a.photo_url, a.publication_subdomain, a.publication_name, bool(a.is_subscribed), bool(a.is_following), a.bestseller_tier, now, now);
  };
  db.exec("BEGIN");
  try {
    for (const n of bundle.notes) {
      if (!n.id) {
        res.skipped++;
        continue;
      }
      const had = !!exists.get(n.id);
      upNote.run(
        n.id,
        n.user_id,
        n.date,
        n.body,
        n.reaction_count,
        n.restacks,
        n.children_count,
        JSON.stringify(n.attachments ?? []),
        n.stats ? JSON.stringify(n.stats) : null,
        n.stats ? bundle.fetched_at : null,
        runId
      );
      delInter.run(n.id);
      for (const a of n.reactors.filter(valid)) {
        actor(a);
        insInter.run(n.id, a.id, "like", 0, null, null, null, runId);
      }
      for (const a of n.restackers.filter(valid)) {
        actor(a);
        insInter.run(n.id, a.id, "restack", 0, null, null, null, runId);
      }
      for (const r of n.replies.filter((r2) => valid(r2.actor))) {
        actor(r.actor);
        insInter.run(n.id, r.actor.id, "reply", r.id, r.date, r.body, r.reaction_count, runId);
      }
      had ? res.updated++ : res.inserted++;
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return res;
}
function bool(v) {
  return v === null ? null : v ? 1 : 0;
}

// src/load/index.ts
function collectCsvPaths(dir) {
  const out = [];
  for (const name of (0, import_node_fs3.readdirSync)(dir)) {
    const p = (0, import_node_path2.join)(dir, name);
    if ((0, import_node_fs3.statSync)(p).isDirectory()) continue;
    const ext = (0, import_node_path2.extname)(name).toLowerCase();
    if (ext === ".csv") out.push(p);
    else if (ext === ".zip") {
      const tmp = (0, import_node_fs3.mkdtempSync)((0, import_node_path2.join)((0, import_node_os.tmpdir)(), "constack-zip-"));
      new import_adm_zip.default(p).extractAllTo(tmp, true);
      for (const inner of (0, import_node_fs3.readdirSync)(tmp)) if ((0, import_node_path2.extname)(inner).toLowerCase() === ".csv") out.push((0, import_node_path2.join)(tmp, inner));
    }
  }
  return out;
}
function loadJsonBundles(db, runId, dir, files, insRaw) {
  for (const name of (0, import_node_fs3.readdirSync)(dir)) {
    if ((0, import_node_path2.extname)(name).toLowerCase() !== ".json") continue;
    const path = (0, import_node_path2.join)(dir, name);
    const rep = { path, kind: "unknown", rows: 0 };
    try {
      const buf = (0, import_node_fs3.readFileSync)(path);
      const data = JSON.parse(buf.toString("utf8"));
      const sha = (0, import_node_crypto2.createHash)("sha256").update(buf).digest("hex");
      if (data.kind === "notes" && Array.isArray(data.notes)) {
        rep.kind = "notes";
        rep.rows = data.notes.length;
        insRaw.run(runId, "notes", path, sha, rep.rows);
        rep.result = loadNotes(db, runId, data);
      } else if ((data.kind === "stackchat-files" || data.kind === "chatstack-files") && data.files && typeof data.files === "object") {
        const tmp = (0, import_node_fs3.mkdtempSync)((0, import_node_path2.join)((0, import_node_os.tmpdir)(), "stackchat-bundle-"));
        const written = [];
        for (const [fileName, content] of Object.entries(data.files)) {
          if (typeof content !== "string") continue;
          const p = (0, import_node_path2.join)(tmp, (0, import_node_path2.basename)(fileName));
          (0, import_node_fs3.writeFileSync)(p, content, "utf8");
          written.push(p);
        }
        insRaw.run(runId, "stackchat-files", path, sha, written.length);
        files.push(...loadCsvPaths(db, runId, written, insRaw));
        continue;
      } else rep.error = "JSON sin `kind` reconocido; no cargado";
    } catch (e) {
      rep.error = String(e);
    }
    files.push(rep);
  }
}
var ORDER = [
  "posts",
  "email_stats",
  "email_list",
  "growth_sources",
  "traffic",
  "free_subscriber_growth",
  "paid_subscriber_growth",
  "subscriber_totals",
  "unknown"
];
function loadCsvPaths(db, runId, paths, insRaw) {
  const out = [];
  const parsed = paths.map((path) => {
    try {
      const { rows, headers, sha256 } = readCsv(path);
      return { path, rows, sha256, kind: detectKind(headers) };
    } catch (e) {
      return { path, rows: [], sha256: "", kind: "unknown", error: String(e) };
    }
  });
  parsed.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  for (const f of parsed) {
    const rep = { path: f.path, kind: f.kind, rows: f.rows.length };
    if (f.error) rep.error = f.error;
    else {
      insRaw.run(runId, f.kind, f.path, f.sha256, f.rows.length);
      try {
        switch (f.kind) {
          case "email_list":
            rep.result = loadEmailList(db, runId, f.rows);
            break;
          case "posts":
            rep.result = loadPosts(db, runId, f.rows);
            break;
          case "email_stats":
            rep.result = loadEmailStats(db, runId, f.rows);
            break;
          case "growth_sources":
            rep.result = loadGrowthSources(db, runId, f.rows);
            break;
          case "traffic":
            rep.result = loadTraffic(db, runId, f.rows);
            break;
          case "free_subscriber_growth":
            rep.result = loadSubscriberGrowth(db, runId, f.rows, "free");
            break;
          case "paid_subscriber_growth":
            rep.result = loadSubscriberGrowth(db, runId, f.rows, "paid");
            break;
          case "subscriber_totals":
            rep.result = loadSubscriberTotals(db, runId, f.rows);
            break;
          default:
            rep.error = "cabeceras no reconocidas; archivo registrado pero no cargado";
        }
      } catch (e) {
        rep.error = String(e);
      }
    }
    out.push(rep);
  }
  return out;
}
function loadDirectory(db, dir) {
  const runId = startRun(db, dir);
  const insRaw = db.prepare("INSERT INTO raw_files (run_id, kind, path, sha256, row_count) VALUES (?, ?, ?, ?, ?)");
  const files = loadCsvPaths(db, runId, collectCsvPaths(dir), insRaw);
  loadJsonBundles(db, runId, dir, files, insRaw);
  const loaded = files.filter((f) => f.result).length;
  const failed = files.filter((f) => f.error && f.kind !== "unknown").length;
  const status = loaded === 0 ? "failed" : failed > 0 ? "partial" : "ok";
  const notes = files.map((f) => `${(0, import_node_path2.basename)(f.path)}: ${f.kind}${f.error ? ` (${f.error})` : ""}`).join("\n");
  finishRun(db, runId, status, notes);
  return { runId, status, files };
}

// src/ingest/substack.ts
var import_node_fs4 = require("node:fs");
var import_node_path3 = require("node:path");

// src/ingest/endpoints.ts
var EMAIL_STATS_COLUMNS = [
  "title",
  "post_date",
  "audience",
  "views",
  "engagement_rate",
  "signups",
  "subscribes",
  "estimated_value",
  "open_rate"
];
var SUBSCRIBER_EXPORT_COLUMNS = [
  "user_email_address",
  "user_name",
  "subscription_type",
  "activity_rating",
  "subscription_created_at",
  "total_revenue_generated",
  "num_comments",
  "num_comments_last_7d",
  "num_comments_last_30d",
  "num_shares",
  "num_shares_last_7d",
  "num_shares_last_30d",
  "country",
  "state",
  "num_emails_received",
  "num_emails_dropped",
  "num_emails_opened",
  "num_email_opens",
  "num_email_opens_last_7d",
  "num_email_opens_last_30d",
  "last_opened_at",
  "links_clicked",
  "last_clicked_at",
  "num_unique_email_posts_seen",
  "num_unique_email_posts_seen_last_7d",
  "num_unique_email_posts_seen_last_30d",
  "num_web_post_views",
  "num_web_post_views_last_7d",
  "num_web_post_views_last_30d",
  "num_unique_web_posts_seen",
  "num_unique_web_posts_seen_last_7d",
  "num_unique_web_posts_seen_last_30d",
  "num_subs_gifted",
  "subscription_expires_at",
  "free_attribution",
  "paid_attribution",
  "days_active_last_30d",
  "first_payment_at",
  "last_subscribed_at",
  "unsubscribed_at",
  "emails_enabled",
  "bestseller_tier",
  "stripe_plan_name",
  "group_membership"
];
var SUBSCRIBER_SET_QUERY = { order_by_desc_nulls_last: "subscription_created_at" };
var PUB = {
  emailStats: () => `/api/v1/publication/stats/email_stats?format=csv&${EMAIL_STATS_COLUMNS.map((c) => `columns%5B%5D=${c}`).join("&")}`,
  traffic: (from, to) => `/api/v1/publication/stats/publication_traffic/timeseries?from=${from}&to=${to}&format=csv`,
  growthSources: (from, to) => `/api/v1/publication/stats/growth/sources?from_date=${from}&to_date=${to}&format=csv`,
  paidSubscriberGrowth: (from, to) => `/api/v1/publication/stats/paid_subscriber_growth?start=${from}&end=${to}&period=day&format=csv`,
  subscriberTotals: (from) => `/api/v1/publication/stats/emails/timeseries?from=${from}T00:00:00.000Z&format=csv&resolution=day`,
  archive: (offset, limit = 50) => `/api/v1/archive?sort=new&limit=${limit}&offset=${offset}`,
  subscriberSet: () => `/api/v1/subscriber_set`,
  subscriberExport: () => `/api/v1/subscriber_set/export`,
  subscriberExportStatus: (id) => `/api/v1/subscriber_set/export/${id}`
};
var SOCIAL = {
  self: () => `/api/v1/user/profile/self`,
  publicProfile: (handleOrId) => `/api/v1/user/${handleOrId}/public_profile`,
  profileFeed: (userId, cursor = "") => `/api/v1/reader/feed/profile/${userId}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
  reactors: (noteId) => `/api/v1/comment/${noteId}/reactors`,
  restackers: (noteId) => `/api/v1/comment/${noteId}/restackers`,
  replies: (noteId, cursor = "") => `/api/v1/reader/comment/${noteId}/replies${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
  noteStats: (noteId) => `/api/v1/note_stats/c-${noteId}`
};
var SOCIAL_ORIGIN = "https://substack.com";
var pubOrigin = (subdomain) => `https://${subdomain}.substack.com`;
var DEFAULT_FROM = "2024-01-01";
var today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function dateChunks(from, to, days) {
  const out = [];
  let a = /* @__PURE__ */ new Date(from + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(to + "T00:00:00Z");
  while (a <= end) {
    const b = new Date(Math.min(a.getTime() + (days - 1) * 864e5, end.getTime()));
    out.push([a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)]);
    a = new Date(b.getTime() + 864e5);
  }
  return out;
}

// src/ingest/notes.ts
var ROOT = SOCIAL_ORIGIN;
function toActor(u) {
  const pub = u.primary_publication ?? u.user_primary_publication ?? null;
  return {
    id: Number(u.id ?? u.user_id),
    name: u.name ?? null,
    handle: u.handle ?? null,
    photo_url: u.photo_url ?? null,
    publication_subdomain: pub?.subdomain ?? null,
    publication_name: pub?.name ?? null,
    is_subscribed: typeof u.is_subscribed === "boolean" ? u.is_subscribed : null,
    is_following: typeof u.is_following === "boolean" ? u.is_following : null,
    bestseller_tier: u.bestseller_tier ?? u.user_bestseller_tier ?? null
  };
}
async function fetchSelfUserId(client) {
  const me = await (await client.get(ROOT + SOCIAL.self(), "application/json")).json();
  if (!me?.id) throw new Error("no pude obtener el id de usuario (user/profile/self)");
  return me.id;
}
var countsOf = (c) => ({
  reaction_count: Number(c.reaction_count ?? 0),
  restacks: Number(c.restacks ?? 0),
  children_count: Number(c.children_count ?? 0)
});
var sameCounts = (a, b) => a.reaction_count === b.reaction_count && a.restacks === b.restacks && a.children_count === b.children_count;
async function fetchOwnNotes(client, userId, opts = {}) {
  const { maxPages = 200, known, stopAfterUnchangedPages = 3 } = opts;
  const out = [];
  let cursor = "";
  let quietPages = 0;
  for (let page = 0; page < maxPages; page++) {
    const payload = await (await client.get(ROOT + SOCIAL.profileFeed(userId, cursor), "application/json")).json();
    const items = payload.items ?? [];
    let novedad = false;
    for (const it of items) {
      const c = it.comment;
      if (it.type !== "comment" || !c || Number(c.user_id) !== userId) continue;
      out.push(c);
      const prev = known?.get(Number(c.id));
      if (!prev || !sameCounts(prev, countsOf(c))) novedad = true;
    }
    if (known) {
      quietPages = novedad ? 0 : quietPages + 1;
      if (quietPages >= stopAfterUnchangedPages) break;
    }
    const next = payload.nextCursor ?? "";
    if (!next || !items.length || next === cursor) break;
    cursor = next;
  }
  return out;
}
async function fetchReplies(client, noteId) {
  const out = [];
  let cursor = "";
  for (let i = 0; i < 50; i++) {
    const payload = await (await client.get(ROOT + SOCIAL.replies(noteId, cursor), "application/json")).json();
    for (const br of payload.commentBranches ?? []) {
      const all = [br.comment, ...(br.descendantComments ?? []).map((d) => d.comment ?? d)].filter(Boolean);
      for (const c of all) {
        out.push({
          id: Number(c.id),
          // En una respuesta `id` es el comentario; la persona es `user_id`.
          actor: toActor({ ...c, id: c.user_id }),
          date: c.date ?? null,
          body: c.body ?? null,
          reaction_count: c.reaction_count ?? null,
          parent_id: c.parent_id ? Number(c.parent_id) : null
        });
      }
    }
    const next = payload.nextCursor ?? "";
    if (!next || next === cursor) break;
    cursor = next;
  }
  return out;
}
async function fetchNoteStats(client, noteId) {
  try {
    const res = await client.get(ROOT + SOCIAL.noteStats(noteId), "application/json", 1);
    const j = await res.json();
    return j && !("error" in j) ? j : null;
  } catch {
    return null;
  }
}
async function collectNotes(client, opts = {}) {
  const log = opts.log ?? (() => {
  });
  const userId = opts.userId ?? await fetchSelfUserId(client);
  const raw = await fetchOwnNotes(client, userId, { known: opts.known });
  const bundle = { kind: "notes", fetched_at: (/* @__PURE__ */ new Date()).toISOString(), user_id: userId, notes: [], errors: [] };
  const pendientes = opts.known ? raw.filter((c) => {
    const prev = opts.known.get(Number(c.id));
    if (!prev) return true;
    const now = countsOf(c);
    if (!sameCounts(prev, now)) return true;
    return !opts.withStats?.has(Number(c.id)) && now.reaction_count + now.restacks + now.children_count > 0;
  }) : raw;
  log(
    opts.known ? `  ${raw.length} notas en el feed, ${pendientes.length} con novedades` : `  ${raw.length} notas propias en el feed`
  );
  const queue = [...pendientes];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const id = Number(c.id);
      const rec = {
        id,
        user_id: userId,
        date: c.date ?? null,
        body: c.body ?? null,
        reaction_count: Number(c.reaction_count ?? 0),
        restacks: Number(c.restacks ?? 0),
        children_count: Number(c.children_count ?? 0),
        attachments: Array.isArray(c.attachments) ? c.attachments.map(slimAttachment) : [],
        reactors: [],
        restackers: [],
        replies: [],
        stats: null
      };
      const step = async (name, fn) => {
        try {
          await fn();
        } catch (e) {
          bundle.errors.push({ note_id: id, step: name, error: e instanceof Error ? e.message : String(e) });
        }
      };
      if (rec.reaction_count > 0)
        await step("reactors", async () => {
          rec.reactors = (await (await client.get(ROOT + SOCIAL.reactors(id), "application/json")).json()).map(toActor);
        });
      if (rec.restacks > 0)
        await step("restackers", async () => {
          rec.restackers = (await (await client.get(ROOT + SOCIAL.restackers(id), "application/json")).json()).map(toActor).filter((a) => a.id !== userId);
        });
      if (rec.children_count > 0)
        await step("replies", async () => {
          rec.replies = (await fetchReplies(client, id)).filter((r) => r.actor.id !== userId);
        });
      const recent = rec.date ? Date.now() - Date.parse(rec.date) < 60 * 864e5 : false;
      if (rec.reaction_count + rec.restacks + rec.children_count > 0 || recent) rec.stats = await fetchNoteStats(client, id);
      bundle.notes.push(rec);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, opts.concurrency ?? 1) }, worker));
  bundle.notes.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return bundle;
}
function slimAttachment(a) {
  return {
    type: a.type ?? null,
    post_id: a.post?.id ?? a.postSelection?.post?.id ?? null,
    post_title: a.post?.title ?? null,
    url: a.post?.canonical_url ?? a.url ?? a.linkMetadata?.url ?? null,
    publication: a.publication?.subdomain ?? a.post?.publication?.subdomain ?? null
  };
}

// src/ingest/substack.ts
var DEFAULT_DELAYS = { retryBaseMs: 1500, pollMs: 2e3, pauseMs: 250 };
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
var SessionExpiredError = class extends Error {
};
var SubstackClient = class {
  constructor(subdomain, cookie, log = () => {
  }, fetchImpl, delays = {}) {
    this.cookie = cookie;
    this.log = log;
    this.base = pubOrigin(subdomain);
    this.fetchImpl = fetchImpl ?? fetch;
    this.delays = { ...DEFAULT_DELAYS, ...delays };
  }
  cookie;
  log;
  base;
  fetchImpl;
  delays;
  headers(extra = {}) {
    return { "user-agent": UA, cookie: this.cookie, referer: `${this.base}/publish/home`, ...extra };
  }
  /** GET con reintentos ante 5xx (503 esporádicos) y 429 (rate limit, con Retry-After si viene). */
  async get(path, accept = "*/*", attempts = 5) {
    const url = path.startsWith("http") ? path : this.base + path;
    let last;
    for (let i = 0; i < attempts; i++) {
      if (this.delays.pauseMs) await sleep(this.delays.pauseMs);
      const res = await this.fetchImpl(url, { headers: this.headers({ accept }), redirect: "follow" });
      if (res.status === 401 || res.status === 403 || res.url.includes("/sign-in")) throw new SessionExpiredError(`HTTP ${res.status} en ${path}`);
      if (res.ok) return res;
      last = res;
      if (res.status !== 429 && res.status < 500) break;
      const retryAfter = Number(res.headers.get("retry-after")) * 1e3;
      const wait = res.status === 429 ? Math.max(retryAfter || 0, this.delays.retryBaseMs * 2 ** (i + 1)) : this.delays.retryBaseMs * (i + 1);
      this.log(`  ${res.status} en ${path.replace(/^https?:\/\/[^/]+/, "")} \u2014 reintento en ${wait}ms`);
      await sleep(wait);
    }
    throw new Error(`HTTP ${last?.status} en ${path}`);
  }
  async postJson(path, body) {
    const res = await this.fetchImpl(this.base + path, {
      method: "POST",
      headers: this.headers({ "content-type": "application/json", accept: "application/json" }),
      body: JSON.stringify(body)
    });
    if (res.status === 401 || res.status === 403) throw new SessionExpiredError(`HTTP ${res.status} en ${path}`);
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  }
  async csv(path) {
    const text = await (await this.get(path, "text/csv,*/*")).text();
    if (/^\s*<!doctype html/i.test(text)) throw new SessionExpiredError("la respuesta es HTML (login) en vez de CSV");
    return text;
  }
  emailStats() {
    return this.csv(PUB.emailStats());
  }
  /** Substack agrega por mes si el rango es amplio; se pide en tramos de 90 días para conservar el detalle diario. */
  async traffic(from = DEFAULT_FROM, to = today()) {
    let header = "";
    const lines = [];
    for (const [a, b] of dateChunks(from, to, 90)) {
      const text = await this.csv(PUB.traffic(a, b));
      const [h, ...rows] = text.trim().split(/\r?\n/);
      header ||= h;
      lines.push(...rows.filter(Boolean));
    }
    return `${header}
${lines.join("\n")}
`;
  }
  growthSources(from = DEFAULT_FROM, to = today()) {
    return this.csv(PUB.growthSources(from, to));
  }
  paidSubscriberGrowth(from = DEFAULT_FROM, to = today()) {
    return this.csv(PUB.paidSubscriberGrowth(from, to));
  }
  /** Serie diaria de suscriptores totales. Substack la devuelve sin cabecera; se la añadimos. */
  async subscriberTotals(from = DEFAULT_FROM) {
    const body = await this.csv(PUB.subscriberTotals(from));
    return `date,total_subscribers
${body.trim()}
`;
  }
  /** Export completo de suscriptores: crea un set, pide el export, sondea hasta tener URL y descarga. */
  async subscriberExport(maxPolls = 60) {
    const set = await this.postJson(PUB.subscriberSet(), { query: SUBSCRIBER_SET_QUERY });
    if (!set?.id) throw new Error(`subscriber_set sin id: ${JSON.stringify(set).slice(0, 200)}`);
    const exp = await this.postJson(PUB.subscriberExport(), {
      subscriberSetId: set.id,
      columns: [...SUBSCRIBER_EXPORT_COLUMNS]
    });
    const exportId = exp.id ?? exp.exportId ?? exp.export_id;
    let fileUrl = exp.url;
    if (!fileUrl) {
      if (!exportId) throw new Error(`export sin id ni url: ${JSON.stringify(exp).slice(0, 200)}`);
      for (let i = 0; i < maxPolls && !fileUrl; i++) {
        await sleep(this.delays.pollMs);
        const res = await this.fetchImpl(this.base + PUB.subscriberExportStatus(exportId), {
          headers: this.headers({ accept: "application/json" })
        });
        if (res.status === 401 || res.status === 403) throw new SessionExpiredError(`HTTP ${res.status} consultando el export`);
        if (!res.ok) continue;
        const st = await res.json();
        fileUrl = st.url;
      }
      if (!fileUrl) throw new Error("el export de suscriptores no estuvo listo a tiempo");
    }
    return this.csv(fileUrl.startsWith("http") ? fileUrl : this.base + fileUrl);
  }
  /** Posts publicados vía /api/v1/archive, convertidos al mismo CSV que el export oficial (posts.csv). */
  async postsCsv() {
    const rows = [];
    for (let offset = 0; ; offset += 50) {
      const page = await (await this.get(PUB.archive(offset), "application/json")).json();
      if (!Array.isArray(page) || page.length === 0) break;
      for (const p of page) {
        rows.push([
          `${p.id}.${p.slug ?? ""}`,
          p.post_date ?? "",
          "true",
          p.email_sent_at ?? "",
          p.email_sent_at ?? "",
          p.type ?? "",
          p.audience ?? "",
          p.title ?? "",
          p.subtitle ?? "",
          p.podcast_url ?? "",
          p.canonical_url ?? "",
          p.wordcount != null ? String(p.wordcount) : ""
        ]);
      }
      if (page.length < 50) break;
    }
    const header = ["post_id", "post_date", "is_published", "email_sent_at", "inbox_sent_at", "type", "audience", "title", "subtitle", "podcast_url", "canonical_url", "wordcount"];
    return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
  }
};
function csvCell(v) {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function ingestSubstack(opts) {
  const log = opts.log ?? (() => {
  });
  (0, import_node_fs4.mkdirSync)(opts.rawDir, { recursive: true });
  const client = new SubstackClient(opts.subdomain, opts.cookie, log, opts.fetchImpl, opts.delays);
  const desde = opts.seriesFrom ?? DEFAULT_FROM;
  const report = { rawDir: opts.rawDir, downloaded: [], failed: [], sessionExpired: false };
  const steps = [
    { kind: "email_list", file: "email_list.csv", run: () => client.subscriberExport() },
    { kind: "posts", file: "posts.csv", run: () => client.postsCsv() },
    { kind: "email_stats", file: "email_stats.csv", run: () => client.emailStats() },
    { kind: "growth_sources", file: "growth_sources.csv", run: () => client.growthSources(desde) },
    { kind: "traffic", file: "traffic.csv", run: () => client.traffic(desde) },
    { kind: "paid_subscriber_growth", file: "paid_subscriber_growth.csv", run: () => client.paidSubscriberGrowth(desde) },
    { kind: "subscriber_totals", file: "subscriber_totals.csv", run: () => client.subscriberTotals(desde) },
    {
      kind: "notes",
      file: "notes.json",
      run: async () => {
        const bundle = await collectNotes(client, {
          log,
          known: opts.knownNotes?.counts,
          withStats: opts.knownNotes?.withStats
        });
        if (bundle.errors.length) log(`  ${bundle.errors.length} peticiones de notas fallaron (se conserva el resto)`);
        return JSON.stringify(bundle);
      }
    }
  ];
  for (const step of steps) {
    try {
      const t0 = Date.now();
      log(`\u2192 ${step.kind}`);
      const text = await step.run();
      log(`  ${step.kind}: ${((Date.now() - t0) / 1e3).toFixed(1)}s`);
      if (!step.file.endsWith(".json") && text.trim().split(/\r?\n/).length < 2) throw new Error("respuesta vac\xEDa");
      const path = (0, import_node_path3.join)(opts.rawDir, step.file);
      (0, import_node_fs4.writeFileSync)(path, text, "utf8");
      report.downloaded.push({ kind: step.kind, path, bytes: Buffer.byteLength(text) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`  \u2717 ${step.kind}: ${msg}`);
      report.failed.push({ kind: step.kind, error: msg });
      if (e instanceof SessionExpiredError) {
        report.sessionExpired = true;
        break;
      }
    }
  }
  return report;
}

// src/ingest/auth.ts
var import_node_fs5 = require("node:fs");
var import_node_path4 = require("node:path");
function cookieFromCurl(text) {
  const m = /(?:^|\s)(?:-b|--cookie)\s+(['"])([\s\S]*?)\1/m.exec(text) ?? /-H\s+(['"])cookie:\s*([\s\S]*?)\1/im.exec(text);
  if (!m) throw new Error("el archivo cURL no contiene cookies (-b o -H 'cookie: ...')");
  const cookie = m[2].replace(/\s*\\\s*\n\s*/g, " ").trim();
  if (!/substack\.sid=/.test(cookie)) {
    throw new Error("las cookies no incluyen substack.sid; copia el cURL desde una pesta\xF1a del panel /publish estando logueado");
  }
  return cookie;
}
function loadAuth(path) {
  if (!(0, import_node_fs5.existsSync)(path)) return null;
  const a = JSON.parse((0, import_node_fs5.readFileSync)(path, "utf8"));
  return a.cookie ? { cookie: a.cookie, saved_at: a.saved_at ?? "" } : null;
}
function saveAuth(path, cookie) {
  (0, import_node_fs5.mkdirSync)((0, import_node_path4.dirname)(path), { recursive: true });
  const auth = { cookie, saved_at: (/* @__PURE__ */ new Date()).toISOString() };
  (0, import_node_fs5.writeFileSync)(path, JSON.stringify(auth, null, 2), { encoding: "utf8", mode: 384 });
  return auth;
}

// src/queryCommand.ts
init_queries();
var UsageError = class extends Error {
};
var str = (f, name) => {
  const v = f[name];
  if (v === void 0) return void 0;
  if (typeof v === "boolean") throw new UsageError(`--${name} necesita un valor`);
  return v;
};
var int = (f, name, fallback) => {
  const v = str(f, name);
  if (v === void 0) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new UsageError(`--${name} debe ser un entero, no ${JSON.stringify(v)}`);
  return n;
};
var bool2 = (f, name) => {
  const v = f[name];
  if (v === void 0) return void 0;
  if (typeof v === "boolean") return v;
  if (/^(true|1|si|sí|yes)$/i.test(v)) return true;
  if (/^(false|0|no)$/i.test(v)) return false;
  throw new UsageError(`--${name} debe ser true o false`);
};
var enumFlag = (f, name, allowed, fallback) => {
  const v = str(f, name);
  if (v === void 0) return fallback;
  if (!allowed.includes(v)) {
    throw new UsageError(`--${name} debe ser uno de: ${allowed.join(", ")}`);
  }
  return v;
};
var POST_SORTS = ["open_rate", "views", "subscribes", "signups", "post_date"];
var NOTE_SORTS = ["date", "reactions", "restacks", "replies", "interactions"];
var GROUPS = ["day", "week", "month", "source"];
var KINDS = ["like", "restack", "reply"];
var QUERIES = {
  overview: {
    summary: "Totales de suscriptores, reparto por plan, altas 30/90d y \xFAltimo sync. Empieza por aqu\xED.",
    run: (db) => getOverview(db)
  },
  subscribers: {
    summary: "Lista contactos con filtros.",
    flags: "--plan free|paid|monthly|yearly --active true|false --after YYYY-MM-DD --before YYYY-MM-DD --email texto --limit N --offset N",
    run: (db, f) => listSubscribers(db, {
      plan: str(f, "plan"),
      is_active: bool2(f, "active"),
      subscribed_after: str(f, "after"),
      subscribed_before: str(f, "before"),
      email_contains: str(f, "email"),
      limit: int(f, "limit", 50),
      offset: int(f, "offset", 0)
    })
  },
  subscriber: {
    summary: "Ficha de un contacto por email, con su historial de plan en cada sync.",
    flags: "--email alguien@ejemplo.com",
    run: (db, f) => {
      const email = str(f, "email");
      if (!email) throw new UsageError("subscriber necesita --email");
      return getSubscriber(db, email) ?? { error: "No existe ese email en la base." };
    }
  },
  candidates: {
    summary: "Free activos ordenados como candidatos a pago por engagement real (activity, aperturas 30d).",
    flags: "--limit N --min-days N",
    run: (db, f) => findUpgradeCandidates(db, int(f, "limit", 50), int(f, "min-days", 14))
  },
  posts: {
    summary: "Posts con views, open_rate, signups y subscribes.",
    flags: `--sort ${POST_SORTS.join("|")} --limit N`,
    run: (db, f) => getPostPerformance(db, enumFlag(f, "sort", POST_SORTS, "post_date"), int(f, "limit", 50))
  },
  growth: {
    summary: "Altas por fuente y series diarias free/paid, agrupadas.",
    flags: `--from YYYY-MM-DD --to YYYY-MM-DD --group-by ${GROUPS.join("|")}`,
    run: (db, f) => getGrowth(db, str(f, "from"), str(f, "to"), enumFlag(f, "group-by", GROUPS, "month"))
  },
  churn: {
    summary: "Bajas y transiciones de plan entre syncs (necesita \u22652 syncs).",
    flags: "--from YYYY-MM-DD --to YYYY-MM-DD",
    run: (db, f) => getChurn(db, str(f, "from"), str(f, "to"))
  },
  notes: {
    summary: "Tus Notes con likes, restacks, respuestas y personas \xFAnicas.",
    flags: `--sort ${NOTE_SORTS.join("|")} --limit N`,
    run: (db, f) => getNotesPerformance(db, enumFlag(f, "sort", NOTE_SORTS, "interactions"), int(f, "limit", 50))
  },
  "note-engagers": {
    summary: "Qui\xE9n interact\xFAa m\xE1s con tus Notes (likes + restacks + respuestas).",
    flags: `--limit N --kind ${KINDS.join("|")}`,
    run: (db, f) => getNoteEngagers(db, int(f, "limit", 30), f.kind === void 0 ? void 0 : enumFlag(f, "kind", KINDS, "like"))
  },
  note: {
    summary: "Una Note con su texto, stats y cada like/restack/respuesta con la persona.",
    flags: "--id 332284631",
    run: (db, f) => {
      const id = int(f, "id", NaN);
      if (!Number.isInteger(id)) throw new UsageError("note necesita --id <n\xFAmero>");
      return getNote(db, id) ?? { error: "No existe esa nota en la base." };
    }
  },
  schema: {
    summary: "Tablas, DDL y n\xFAmero de filas. \xDAtil antes de escribir SQL a mano.",
    run: (db) => getSchema(db)
  }
};
var QUERY_NAMES = Object.keys(QUERIES);
function runQuery(db, name, flags) {
  const def = QUERIES[name];
  if (!def) {
    throw new UsageError(`Consulta desconocida: ${name}

Disponibles:
${helpText()}`);
  }
  return def.run(db, flags);
}
function helpText() {
  return QUERY_NAMES.map((n) => {
    const d = QUERIES[n];
    return `  ${n.padEnd(15)} ${d.summary}${d.flags ? `
  ${" ".repeat(15)} ${d.flags}` : ""}`;
  }).join("\n");
}
function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok.startsWith("--")) throw new UsageError(`Argumento inesperado: ${tok} (se esperaba --flag)`);
    const eq = tok.indexOf("=");
    if (eq !== -1) {
      flags[tok.slice(2, eq)] = tok.slice(eq + 1);
      continue;
    }
    const name = tok.slice(2);
    const next = argv[i + 1];
    if (next !== void 0 && !next.startsWith("--")) {
      flags[name] = next;
      i++;
    } else flags[name] = true;
  }
  return flags;
}

// src/cli.ts
init_queries();

// src/paths.ts
var import_node_os2 = require("node:os");
var import_node_path5 = require("node:path");
var import_node_fs6 = require("node:fs");
function stackchatHome() {
  return process.env.STACKCHAT_HOME ? (0, import_node_path5.resolve)(process.env.STACKCHAT_HOME) : (0, import_node_path5.join)((0, import_node_os2.homedir)(), ".stackchat");
}
var configPath = () => (0, import_node_path5.join)(stackchatHome(), "config.json");
var authPath = () => (0, import_node_path5.join)(stackchatHome(), "auth.json");
var rawDir = () => (0, import_node_path5.join)(stackchatHome(), "raw");
function dbPath(override) {
  const v = override ?? process.env.STACKCHAT_DB ?? process.env.CONSTACK_DB;
  if (v === ":memory:") return v;
  return v ? (0, import_node_path5.resolve)(v) : (0, import_node_path5.join)(stackchatHome(), "stackchat.db");
}
function ensureHome() {
  const dir = stackchatHome();
  (0, import_node_fs6.mkdirSync)(dir, { recursive: true });
  return dir;
}
function loadConfig() {
  const p = configPath();
  if (!(0, import_node_fs6.existsSync)(p)) return null;
  try {
    const c = JSON.parse((0, import_node_fs6.readFileSync)(p, "utf8"));
    return c.subdomain ? c : null;
  } catch {
    return null;
  }
}
function saveConfig(c) {
  ensureHome();
  (0, import_node_fs6.writeFileSync)(configPath(), JSON.stringify(c, null, 2) + "\n", "utf8");
  return c;
}
function resolveSubdomain(explicit) {
  return explicit ?? loadConfig()?.subdomain ?? process.env.STACKCHAT_SUB ?? process.env.CONSTACK_SUB ?? null;
}

// src/connect.ts
var UA2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
var NotConnectedError = class extends Error {
};
async function verifySession(cookie, fetchImpl = fetch) {
  const get = async (path) => {
    const res = await fetchImpl(SOCIAL_ORIGIN + path, {
      headers: { "user-agent": UA2, cookie, accept: "application/json" },
      redirect: "follow"
    });
    if (res.status === 401 || res.status === 403) throw new NotConnectedError("La sesi\xF3n de Substack no es v\xE1lida o ha caducado.");
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}`);
    const text = await res.text();
    if (/^\s*<!doctype html/i.test(text)) throw new NotConnectedError("Substack respondi\xF3 con la p\xE1gina de login: la sesi\xF3n no vale.");
    return JSON.parse(text);
  };
  const me = await get(SOCIAL.self());
  if (!me?.id) throw new NotConnectedError("La respuesta no trae un id de usuario: la sesi\xF3n no vale.");
  return {
    user_id: Number(me.id),
    handle: me.handle ?? null,
    name: me.name ?? null,
    publications: extractPublications(me)
  };
}
function extractPublications(me) {
  const found = /* @__PURE__ */ new Map();
  const add = (p) => {
    const subdomain = p?.subdomain;
    if (typeof subdomain === "string" && subdomain) {
      found.set(subdomain, { subdomain, name: p.name ?? null, id: p.id });
    }
  };
  add(me.primary_publication);
  for (const key of ["publications", "publicationUsers", "publication_users", "userPublications"]) {
    const list = me[key];
    if (Array.isArray(list)) for (const item of list) add(item?.publication ?? item);
  }
  return [...found.values()];
}
async function connect(cookie, opts = {}) {
  const identity = await verifySession(cookie, opts.fetchImpl ?? fetch);
  const pubs = identity.publications;
  let chosen;
  if (opts.subdomain) {
    chosen = pubs.find((p) => p.subdomain === opts.subdomain) ?? { subdomain: opts.subdomain, name: null };
  } else if (pubs.length === 1) {
    chosen = pubs[0];
  }
  if (!chosen) return { identity, config: null, needsChoice: pubs };
  saveAuth(authPath(), cookie);
  const config = saveConfig({
    subdomain: chosen.subdomain,
    user_id: identity.user_id,
    handle: identity.handle ?? void 0,
    publication_name: chosen.name ?? void 0,
    connected_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { identity, config, needsChoice: [] };
}

// src/syncControl.ts
var import_node_fs7 = require("node:fs");
var import_node_path6 = require("node:path");
var import_node_child_process = require("node:child_process");
var lockPath = () => (0, import_node_path6.join)(stackchatHome(), "sync.lock");
var logPath = () => (0, import_node_path6.join)(stackchatHome(), "last-sync.log");
var LOCK_TTL_MS = 15 * 60 * 1e3;
function hoursSinceLastSync(db, now = Date.now()) {
  const row = db.prepare("SELECT finished_at FROM sync_runs WHERE finished_at IS NOT NULL ORDER BY id DESC LIMIT 1").get();
  if (!row?.finished_at) return null;
  const t = Date.parse(row.finished_at);
  return Number.isFinite(t) ? (now - t) / 36e5 : null;
}
function isFresh(db, maxAgeHours, now = Date.now()) {
  const h = hoursSinceLastSync(db, now);
  return h !== null && h < maxAgeHours;
}
function acquireLock(now = Date.now(), pid = process.pid) {
  ensureHome();
  const p = lockPath();
  if ((0, import_node_fs7.existsSync)(p)) {
    try {
      const held = JSON.parse((0, import_node_fs7.readFileSync)(p, "utf8"));
      const age = now - Date.parse(held.started_at);
      if (Number.isFinite(age) && age < LOCK_TTL_MS && held.pid !== pid && isAlive(held.pid)) return false;
    } catch {
    }
  }
  (0, import_node_fs7.writeFileSync)(p, JSON.stringify({ pid, started_at: new Date(now).toISOString() }), "utf8");
  return true;
}
function releaseLock() {
  try {
    (0, import_node_fs7.unlinkSync)(lockPath());
  } catch {
  }
}
function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function writeSyncLog(line) {
  ensureHome();
  try {
    (0, import_node_fs7.appendFileSync)(logPath(), `${(/* @__PURE__ */ new Date()).toISOString()} ${line}
`, "utf8");
  } catch {
  }
}
function readLastSyncLog() {
  try {
    const lines = (0, import_node_fs7.readFileSync)(logPath(), "utf8").trim().split(/\r?\n/).filter(Boolean);
    return lines.length ? lines[lines.length - 1] : null;
  } catch {
    return null;
  }
}
function relaunchDetached(argv, execPath = process.execPath) {
  const child = (0, import_node_child_process.spawn)(execPath, argv, {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  child.unref();
  return child.pid;
}

// src/cli.ts
var HELP = `stackchat \u2014 tus datos de Substack en una base local que puedes consultar

Uso:
  stackchat connect --cookies <archivo.curl> [--sub <subdominio>]
                  Verifica tu sesi\xF3n, detecta tu publicaci\xF3n y lo guarda en ~/.stackchat.
                  El archivo sale de Chrome: en el panel de Substack, F12 \u2192 Network \u2192
                  recargar \u2192 clic derecho en la primera petici\xF3n \u2192 Copy as cURL (bash).
  stackchat status
                  Dice si hay sesi\xF3n, a qu\xE9 publicaci\xF3n apunta y cu\xE1ndo fue el \xFAltimo sync.
  stackchat sync  [--full] [--if-stale <horas>] [--background] [--sub <subdominio>]
                  Descarga tus datos de Substack y los carga en la base. Por defecto es
                  incremental: solo pide las interacciones de las notas cuyos contadores
                  han cambiado, y acorta el rango de las series (~10 s sin novedades,
                  frente a 3-4 min de un sync completo). --full lo fuerza todo.
                  --if-stale N no hace nada si el \xFAltimo sync es m\xE1s reciente que N horas.
                  --background se desasocia y devuelve al instante (para hooks).
  stackchat load  <carpeta>
                  Carga CSV/ZIP/notes.json ya descargados (lo usa la v\xEDa del navegador).
  stackchat q <consulta> [--flags]
                  Consulta la base y escribe JSON en stdout. Consultas:
${helpText()}

  stackchat sql "<SELECT ...>" [--max-rows N]
                  SELECT de solo lectura sobre la base (LIMIT 200 por defecto).

Todo vive en ~/.stackchat (config.json, auth.json, stackchat.db, raw/).
Variables: STACKCHAT_HOME, STACKCHAT_DB, STACKCHAT_SUB.
`;
async function main() {
  for (const s of [process.stdout, process.stderr]) {
    s.on("error", (e) => {
      if (e.code === "EPIPE") process.exit(0);
      throw e;
    });
  }
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const log = (m) => process.stderr.write(m + "\n");
  if (cmd === "q" || cmd === "sql") {
    const name = argv[1];
    const flags = parseFlags(argv.slice(2));
    const db = openDb(dbPath(typeof flags.db === "string" ? flags.db : void 0));
    if (!name) {
      log(cmd === "q" ? `Falta la consulta: stackchat q <consulta>

${helpText()}` : 'Falta la consulta: stackchat sql "SELECT ..."');
      process.exit(2);
    }
    const result = cmd === "q" ? runQuery(db, name, flags) : querySql(db, name, typeof flags["max-rows"] === "string" ? Number(flags["max-rows"]) : 200);
    process.stdout.write(JSON.stringify(result, null, 1) + "\n");
    return;
  }
  const { values, positionals } = (0, import_node_util.parseArgs)({
    args: argv,
    allowPositionals: true,
    options: {
      db: { type: "string" },
      sub: { type: "string" },
      cookies: { type: "string" },
      full: { type: "boolean" },
      background: { type: "boolean" },
      "if-stale": { type: "string" },
      help: { type: "boolean", short: "h" }
    }
  });
  if (!cmd || values.help) {
    process.stdout.write(HELP);
    process.exit(cmd ? 0 : 1);
  }
  const dbFile = dbPath(values.db);
  switch (cmd) {
    case "connect": {
      if (!values.cookies) {
        log(
          "Falta el archivo: stackchat connect --cookies <archivo.curl>\n\nS\xE1calo de Chrome: abre el panel de tu Substack, F12 \u2192 pesta\xF1a Network \u2192 recarga con\nCtrl+R \u2192 clic derecho en la primera petici\xF3n \u2192 Copy \u2192 Copy as cURL (bash) \u2192 p\xE9galo\nen un archivo de texto y pasa su ruta aqu\xED."
        );
        process.exit(2);
      }
      const curlFile = (0, import_node_path7.resolve)(values.cookies);
      const r = await connect(cookieFromCurl((0, import_node_fs8.readFileSync)(curlFile, "utf8")), { subdomain: values.sub });
      if (!r.config) {
        log(
          "Administras varias publicaciones. Repite eligiendo una con --sub:\n" + r.needsChoice.map((p) => `  --sub ${p.subdomain}${p.name ? `   (${p.name})` : ""}`).join("\n")
        );
        process.exit(2);
      }
      log(
        `Conectado como ${r.identity.handle ?? r.identity.user_id} \u2192 ${r.config.subdomain}${r.config.publication_name ? ` (${r.config.publication_name})` : ""}`
      );
      log(`Guardado en ${stackchatHome()}`);
      log(`Borra ${curlFile} cuando termines: contiene tu sesi\xF3n.`);
      log("Ahora: stackchat sync");
      return;
    }
    case "status": {
      const config = loadConfig();
      const auth = loadAuth(authPath());
      const db = openDb(dbFile);
      const last = db.prepare("SELECT id, finished_at, status FROM sync_runs WHERE status <> 'running' ORDER BY id DESC LIMIT 1").get();
      process.stdout.write(
        JSON.stringify(
          {
            home: stackchatHome(),
            connected: !!auth,
            subdomain: config?.subdomain ?? null,
            publication_name: config?.publication_name ?? null,
            handle: config?.handle ?? null,
            db: dbFile,
            last_sync: last ?? null,
            last_background_sync: readLastSyncLog()
          },
          null,
          1
        ) + "\n"
      );
      return;
    }
    case "mcp": {
      const { serveStdio: serveStdio2 } = await Promise.resolve().then(() => (init_server(), server_exports));
      await serveStdio2(openDb(dbFile));
      return;
    }
    case "load": {
      const dir = positionals[1];
      if (!dir) {
        log("Falta la carpeta: stackchat load <carpeta>");
        process.exit(2);
      }
      printReport(loadDirectory(openDb(dbFile), (0, import_node_path7.resolve)(dir)), log);
      return;
    }
    case "sync": {
      const sub = resolveSubdomain(values.sub);
      const auth = loadAuth(authPath());
      if (!sub || !auth) {
        log("No hay sesi\xF3n guardada. Ejecuta primero:\n  stackchat connect --cookies <archivo.curl>");
        process.exit(2);
      }
      const db = openDb(dbFile);
      if (values["if-stale"] !== void 0) {
        const horas = Number(values["if-stale"]);
        if (!Number.isFinite(horas) || horas < 0) {
          log("--if-stale espera un n\xFAmero de horas, p. ej. --if-stale 6");
          process.exit(2);
        }
        if (isFresh(db, horas)) {
          log(`Los datos tienen menos de ${horas} h; no hay nada que hacer.`);
          return;
        }
      }
      if (values.background) {
        const args = [process.argv[1], ...process.argv.slice(2).filter((a) => a !== "--background")];
        log(`sync lanzado en segundo plano (pid ${relaunchDetached(args)})`);
        return;
      }
      if (!acquireLock()) {
        log("Ya hay un sync en marcha; no lanzo otro.");
        return;
      }
      try {
        const code = await runSync({ sub, cookie: auth.cookie, db, full: !!values.full, log });
        if (code) process.exit(code);
      } finally {
        releaseLock();
      }
      return;
    }
    default:
      log(`Comando desconocido: ${cmd}
`);
      process.stdout.write(HELP);
      process.exit(2);
  }
}
async function runSync(o) {
  const dir = (0, import_node_path7.join)(rawDir(), (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"));
  const ingest = await ingestSubstack({
    subdomain: o.sub,
    rawDir: dir,
    cookie: o.cookie,
    log: o.log,
    // Sin `knownNotes` el sync es completo; con él, solo pide lo que cambió.
    knownNotes: o.full ? void 0 : knownNotes(o.db),
    // Las series viejas ya están en la BD y no cambian: en incremental, solo los últimos 120 días.
    seriesFrom: o.full ? void 0 : new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10)
  });
  if (ingest.sessionExpired) {
    o.log("La sesi\xF3n de Substack ha caducado. Repite `stackchat connect` con un cURL nuevo.");
    writeSyncLog("fall\xF3: la sesi\xF3n de Substack ha caducado");
    return 2;
  }
  if (ingest.failed.length) o.log(`Fallaron: ${ingest.failed.map((f) => `${f.kind} (${f.error})`).join("; ")}`);
  if (!ingest.downloaded.length) {
    o.log("No se descarg\xF3 nada; no hay nada que cargar.");
    writeSyncLog("fall\xF3: no se descarg\xF3 nada");
    return 2;
  }
  const rep = loadDirectory(o.db, dir);
  printReport(rep, o.log);
  writeSyncLog(
    `sync #${rep.runId} ${rep.status}${ingest.failed.length ? ` (${ingest.failed.length} fuentes fallaron)` : ""}`
  );
  return ingest.failed.length ? 3 : 0;
}
function printReport(rep, log) {
  log(`Sync #${rep.runId}: ${rep.status}`);
  for (const f of rep.files) {
    const r = f.result ? ` \u2192 ${f.result.inserted} ins, ${f.result.updated} upd, ${f.result.skipped} skip` : "";
    log(`  ${f.kind.padEnd(24)} ${f.rows} filas${r}${f.error ? `  [${f.error}]` : ""}`);
  }
}
main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}
`);
  process.exit(e instanceof UsageError || e?.constructor?.name === "NotConnectedError" ? 2 : 1);
});
