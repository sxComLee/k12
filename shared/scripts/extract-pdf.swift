import Foundation
import PDFKit

struct ExtractedPage: Codable {
    let pageNumber: Int
    let label: String?
    let text: String
}

struct ExtractedDocument: Codable {
    let sourcePDF: String
    let bookTitle: String
    let pageCount: Int
    let extractedAt: String
    let pages: [ExtractedPage]
}

let args = CommandLine.arguments
guard args.count == 3 else {
    fputs("Usage: swift shared/scripts/extract-pdf.swift <input-pdf> <output-json>\n", stderr)
    exit(1)
}

let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])

guard let document = PDFDocument(url: inputURL) else {
    fputs("Unable to open PDF at \(inputURL.path)\n", stderr)
    exit(1)
}

func deriveBookTitle(from inputURL: URL) -> String {
    let baseName = inputURL.deletingPathExtension().lastPathComponent
    return baseName
        .replacingOccurrences(of: "(", with: "（")
        .replacingOccurrences(of: ")", with: "）")
}

let pages = (0..<document.pageCount).map { index -> ExtractedPage in
    guard let page = document.page(at: index) else {
        fputs("Unable to read page \(index + 1) from \(inputURL.path)\n", stderr)
        exit(1)
    }

    let rawText = (page.string ?? "")
        .replacingOccurrences(of: "\u{00A0}", with: " ")
        .replacingOccurrences(of: "\r\n", with: "\n")

    return ExtractedPage(
        pageNumber: index + 1,
        label: page.label,
        text: rawText
    )
}

let payload = ExtractedDocument(
    sourcePDF: inputURL.lastPathComponent,
    bookTitle: deriveBookTitle(from: inputURL),
    pageCount: document.pageCount,
    extractedAt: ISO8601DateFormatter().string(from: Date()),
    pages: pages
)

try FileManager.default.createDirectory(
    at: outputURL.deletingLastPathComponent(),
    withIntermediateDirectories: true,
    attributes: nil
)

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
let data = try encoder.encode(payload)
try data.write(to: outputURL)

print("Extracted \(document.pageCount) pages to \(outputURL.path)")
