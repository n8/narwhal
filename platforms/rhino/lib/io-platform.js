// IO: Rhino

var Binary = require("./binary").Binary;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
};

IO.prototype.read = function(length) {
    var readAll = false,
        buffers = [],
        buffer  = null,
        total   = 0,
        index   = 0,
        read    = 0;
    
    if (typeof length !== "number") {
        readAll = true;
        length = 1024;
    }
        
    do {
        if (!buffer)
            buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
        
        read = this.inputStream.read(buffer, index, buffer.length - index);
        
        if (read < 0)
            break;
        
        index += read;
        total += read;
        
        if (index >= buffer.length) {
            buffers.push(buffer);
            buffer = null;
            index = 0;
        }

        if (read == buffer.length)
            length *= 2;
        
        //print("read="+read+" index="+index+" total="+total+" length="+length+" buffers.length="+buffers.length);
        
    } while (readAll && read > 0);
    
    var resultBuffer, resultLength;
    
    if (buffers.length === 1 && index === 0) {
        resultBuffer = buffers[0]
        resultLength = resultBuffer.length;
    }
    else {
        resultBuffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, total),
        resultLength = 0;
            
        for (var i = 0; i < buffers.length; i++) {
            var buf = buffers[i];
            java.lang.System.arraycopy(buf, 0, resultBuffer, resultLength, buf.length);
            resultLength += buf.length;
        }
        
        if (index > 0) {
            java.lang.System.arraycopy(buffer, 0, resultBuffer, resultLength, index);
            resultLength += index;
        }
    }
    
    if (total != resultLength || total !== resultBuffer.length)
        throw new Error("IO.read sanity check failed: total="+total+" resultLength="+resultLength+" resultBuffer.length="+resultBuffer.length);
        
    return new Binary(resultBuffer);
};

IO.prototype.write = function(object, charset) {
    if (object === null || object === undefined || typeof object.toBinary !== "function")
        throw new Error("Argument to IO.write must have toBinary() method");

    var binary = object.toBinary(charset);
    this.outputStream.write(binary.bytes);
};

IO.prototype.flush = function() {
    this.outputStream.flush();
};

IO.prototype.close = function() {
    if (this.inputStream)
        this.inputStream.close();
    if (this.outputStream)
        this.outputStream.close();
};

IO.prototype.isatty = function () {
    return false;
};

exports.TextInputStream = function (raw, lineBuffering, buffering, charset, options) {
    var stream;

    if (charset === undefined)
        stream = new Packages.java.io.InputStreamReader(raw.inputStream);
    else
        stream = new Packages.java.io.InputStreamReader(raw.inputStream, charset);

    if (buffering === undefined)
        stream = new Packages.java.io.BufferedReader(stream);
    else
        stream = new Packages.java.io.BufferedReader(stream, buffering);

    var self = this;

    self.readLine = function () {
        var line = stream.readLine();
        if (line === null)
            return '';
        return String(line) + "\n";
    };

    self.iter = function () {
        return self;
    };

    self.next = function () {
        var line = stream.readLine();
        if (line === null)
            throw new Error("StopIteration");
        return line;
    };

    self.input = function () {
        throw "NYI";
    };

    self.readLines = function () {
        var lines = [];
        do {
            var line = self.readLine();
            lines.push(line);
        } while (line.length);
        return lines;
    };

    self.read = function () {
        return self.readLines().join('');
    };

    self.readInto = function (buffer) {
        throw "NYI";
    };

    self.close = function () {
        stream.close();
    };

};

exports.TextOutputStream = function (raw, lineBuffering, buffering, charset, options) {
    var stream;

    if (charset === undefined)
        stream = new Packages.java.io.OutputStreamWriter(raw.outputStream);
    else
        stream = new Packages.java.io.OutputStreamWriter(raw.outputStream, charset);

    if (buffering === undefined)
        stream = new Packages.java.io.BufferedWriter(stream);
    else
        stream = new Packages.java.io.BufferedWriter(stream, buffering);

    var self = this;

    self.write = function () {
        stream.write.apply(stream, arguments);
    };

    self.writeLine = function (line) {
        self.write(line + "\n"); // todo recordSeparator
    };

    self.writeLines = function (lines) {
        lines.forEach(self.writeLine);
    };

    self.print = function () {
        self.write(Array.prototype.join.call(arguments, " ") + "\n");
        // todo recordSeparator, fieldSeparator
    };

    self.flush = function () {
        stream.flush();
    };

    self.close = function () {
        stream.close();
    };

};

exports.TextIOWrapper = function (raw, mode, lineBuffering, buffering, charset, options) {
    if (mode.update) {
        return new exports.TextIOStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.write || mode.append) {
        return new exports.TextOutputStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.read) {
        return new exports.TextInputStream(raw, lineBuffering, buffering, charset, options);
    } else {
        throw new Error("file must be opened for read, write, or append mode.");
    }
}; 
