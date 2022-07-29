import { Box, Text, Stack, Image, ColorProps } from "@chakra-ui/react";

export interface fileType {
  path: string;
  type: "file" | "folder";
  name: string;
  mimeType: string;
  data: string;
}

/**
 * File uploader component
 *
 * @param maxSize The maximum size in bytes of a file to be uploaded
 * @param fileType The type of a file to be uploaded
 * @param primaryColor Primary component color
 * @param secondaryColor Secondary component color
 * @param backgroundColor Background color
 * @param showOver Show opacity when dragging file over the component
 * @param onUploadStart A function called before processing the files uploaded
 * @param onUploadEnd A function called after processing the files uploaded
 */
export default function FileUploader({
  maxSize = 10 * 1000000,
  fileType = "other",
  primaryColor = "blue.400",
  secondaryColor = "gray.100",
  backgroundColor = "white",
  showOver = true,
  onUploadStart,
  onUploadEnd,
}: {
  maxSize?: number;
  fileType?: "image" | "video" | "audio" | "text" | "pdf" | "other";
  primaryColor?: ColorProps["color"];
  secondaryColor?: ColorProps["color"];
  backgroundColor?: ColorProps["color"];
  showOver?: boolean;
  onUploadStart: () => void;
  onUploadEnd: (files: fileType[]) => void;
}) {
  // Drop handler function to get all files
  async function getAllFileEntries(
    dataTransferItemList: DataTransferItemList
  ): Promise<fileType[]> {
    let fileEntries: fileType[] = [];

    // Use BFS to traverse entire directory/file structure
    let queue = [];

    // Unfortunately dataTransferItemList is not iterable i.e. no forEach
    for (let i = 0; i < dataTransferItemList.length; i++) {
      // Note webkitGetAsEntry a non-standard feature and may change
      // Usage is necessary for handling directories
      queue.push(dataTransferItemList[i].webkitGetAsEntry());
    }

    // Process files while the queue is empty
    while (queue.length > 0) {
      let entry = queue.shift();

      if (entry && entry.isFile) {
        // This is a file
        await new Promise((resolve, reject) => {
          // Read file data and save to base64
          (entry as FileSystemFileEntry).file((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = () => {
              // Do all the checks
              if (
                (maxSize == -1 || file.size < maxSize) &&
                (file.type.split("/")[0] == fileType ||
                  (file.type == "application/pdf" && fileType == "pdf") ||
                  fileType == "other")
              ) {
                fileEntries.push({
                  path: (entry as FileSystemFileEntry).fullPath.replace(
                    (entry as FileSystemFileEntry).name,
                    ""
                  ),
                  type: "file",
                  name: file.name,
                  mimeType: file.type || "application/octet-stream",
                  data: reader.result?.toString() || "",
                });
              }
              resolve(0);
            };

            reader.onerror = reject;
          });
        });
      } else if (entry && entry.isDirectory) {
        // This is a folder
        fileEntries.push({
          path: entry.fullPath.replace(entry.name, ""),
          type: "folder",
          name: (entry as FileSystemDirectoryEntry).name,
          mimeType: "folder/folder",
          data: "",
        });

        let reader = (entry as FileSystemDirectoryEntry).createReader();
        queue.push(...(await readAllDirectoryEntries(reader)));
      }
    }

    return fileEntries;
  }

  // Get all the entries (files or sub-directories) in a directory by calling readEntries until it returns empty array
  async function readAllDirectoryEntries(
    directoryReader: FileSystemDirectoryReader
  ) {
    let entries = [];
    let readEntries: any = await readEntriesPromise(directoryReader);

    while (readEntries.length > 0) {
      entries.push(...readEntries);
      readEntries = await readEntriesPromise(directoryReader);
    }

    return entries;
  }

  // Wrap readEntries in a promise to make working with readEntries easier
  async function readEntriesPromise(
    directoryReader: FileSystemDirectoryReader
  ) {
    try {
      return await new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
      });
    } catch (err) {
      console.log(err);
    }
  }

  // Format the file size of a file from bytes to a better readable format
  function formatFileSize(bytes: any) {
    if (bytes >= 1000000000000) {
      bytes = (bytes / 100000000000).toFixed(1) + " TB";
    } else if (bytes >= 1000000000) {
      bytes = (bytes / 100000000).toFixed(1) + " GB";
    } else if (bytes >= 1000000) {
      bytes = (bytes / 1000000).toFixed(1) + " MB";
    } else if (bytes >= 1000) {
      bytes = (bytes / 1000).toFixed(1) + " KB";
    } else if (bytes > 1) {
      bytes = bytes + " bytes";
    } else if (bytes == 1) {
      bytes = bytes + " byte";
    } else {
      bytes = "0 GB";
    }

    return bytes;
  }

  // The main render of the component
  return (
    <Stack
      backgroundColor={backgroundColor}
      transition="opacity 250ms ease-in-out"
      direction="column"
      spacing="1rem"
      padding="1rem 4rem"
      alignItems="center"
      textAlign="center"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="10px"
      onDragOver={(e) => {
        // Prevent default browser action for file drag
        e.stopPropagation();
        e.preventDefault();

        showOver && (e.currentTarget.style.opacity = "0.6");
      }}
      onDragLeave={(e) => {
        // Prevent default browser action for file drag
        e.stopPropagation();
        e.preventDefault();

        showOver && (e.currentTarget.style.opacity = "1");
      }}
      onDrop={async (e) => {
        // Prevent default browser action for file drop
        e.stopPropagation();
        e.preventDefault();

        showOver && (e.currentTarget.style.opacity = "1");

        if (e.dataTransfer.files.length > 0) {
          // Call this before processing the files
          onUploadStart();

          // Process the files
          let items = await getAllFileEntries(e.dataTransfer.items);

          // Call this after the processing of the file is finished
          onUploadEnd(items);
        }
      }}
    >
      <Box
        padding="1rem"
        backgroundColor={secondaryColor}
        borderRadius="10px"
        margin="auto"
      >
        <Image
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcuNSAxNi4yNUg1LjYyNUM0LjQ2NDY4IDE2LjI1IDMuMzUxODggMTUuNzg5MSAyLjUzMTQxIDE0Ljk2ODZDMS43MTA5NCAxNC4xNDgxIDEuMjUgMTMuMDM1MyAxLjI1IDExLjg3NUMxLjI1IDEwLjcxNDcgMS43MTA5NCA5LjYwMTg4IDIuNTMxNDEgOC43ODE0MUMzLjM1MTg4IDcuOTYwOTQgNC40NjQ2OCA3LjUgNS42MjUgNy41QzUuOTkxMDQgNy40OTk4NiA2LjM1NTcyIDcuNTQ0NDYgNi43MTA5NCA3LjYzMjgxIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjEuODc1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTYuMjUgMTBDNi4yNSA5LjAwOTY4IDYuNDg1MzMgOC4wMzM1MyA2LjkzNjYgNy4xNTJDNy4zODc4OCA2LjI3MDQ3IDguMDQyMTcgNS41MDg3OSA4Ljg0NTU2IDQuOTI5NzRDOS42NDg5NSA0LjM1MDY4IDEwLjU3ODQgMy45NzA4MyAxMS41NTc0IDMuODIxNDhDMTIuNTM2NCAzLjY3MjEzIDEzLjUzNjkgMy43NTc1NiAxNC40NzY0IDQuMDcwNzNDMTUuNDE1OSA0LjM4MzkgMTYuMjY3NiA0LjkxNTg0IDE2Ljk2MTIgNS42MjI3MkMxNy42NTQ3IDYuMzI5NiAxOC4xNzA0IDcuMTkxMTggMTguNDY1NyA4LjEzNjQ1QzE4Ljc2MSA5LjA4MTczIDE4LjgyNzQgMTAuMDgzNiAxOC42NTk1IDExLjA1OTZDMTguNDkxNiAxMi4wMzU2IDE4LjA5NDIgMTIuOTU3NyAxNy41IDEzLjc1IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjEuODc1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTkuMjI2NTYgMTIuNjQ4NEwxMS44NzUgMTBMMTQuNTIzNCAxMi42NDg0IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjEuODc1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTExLjg3NSAxNi4yNVYxMCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxLjg3NSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo="
          height="20px"
          width="20px"
        />
      </Box>
      <Stack direction="column" spacing="0.5rem">
        <Box fontSize="sm">
          <Text
            position="relative"
            display="inline"
            color={primaryColor}
            fontWeight="bold"
            cursor="pointer"
          >
            Click to upload
            <input /* This component is only clickable but not viewable */
              type="file"
              placeholder=""
              accept={
                fileType == "pdf"
                  ? "application/pdf"
                  : fileType == "other"
                  ? "*"
                  : fileType + "/*"
              }
              style={{
                opacity: "0",
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                marginTop: "-2px",
                fontSize: "0",
                cursor: "pointer",
              }}
              multiple={true}
              onChange={async (e) => {
                // Prevent default browser action for file upload
                e.preventDefault();
                e.stopPropagation();

                if (e.target.files && e.target.files.length > 0) {
                  // Call this before processing the files
                  onUploadStart();

                  let items: fileType[] = [];

                  for (var i = 0; i < e.target.files.length; i++) {
                    // This is a file (cannot upload folder via input tag)
                    await new Promise((resolve, reject) => {
                      // Read file data and save to base64
                      const file = e.target.files?.item(i);

                      if (file) {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);

                        reader.onload = () => {
                          // Do all the checks
                          if (
                            (maxSize == -1 || file.size < maxSize) &&
                            (file.type.split("/")[0] == fileType ||
                              (file.type == "application/pdf" &&
                                fileType == "pdf") ||
                              fileType == "other")
                          ) {
                            items.push({
                              path: "/",
                              type: "file",
                              name: file.name,
                              mimeType: file.type || "application/octet-stream",
                              data: reader.result?.toString() || "",
                            });
                          }
                          resolve(0);
                        };

                        reader.onerror = reject;
                      }
                    });
                  }

                  // Call this after the processing of the file is finished
                  onUploadEnd(items);
                }
              }}
            />
          </Text>{" "}
          <Text display="inline">or drag and drop</Text>
        </Box>
        <Text fontSize="xs">
          {fileType == "audio"
            ? "Audio files"
            : fileType == "image"
            ? "Image files"
            : fileType == "video"
            ? "Video files"
            : fileType == "text"
            ? "Text files"
            : fileType == "pdf"
            ? "PDF files"
            : fileType == "other"
            ? "Any type of file"
            : ""}{" "}
          up to {formatFileSize(maxSize)}
        </Text>
      </Stack>
    </Stack>
  );
}
