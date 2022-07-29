import { Center, Link, Text } from "@chakra-ui/react";
import FileUploader from "../components/FileUploader";

export default function Page() {
  const onUploadStart = () => {
    console.log("Loading files");
  };

  const onUploadEnd = (
    items: {
      path: string;
      type: "file" | "folder";
      name: string;
      mimeType: string;
      data: string;
    }[]
  ) => {
    console.log(
      "Tot Files: ",
      items.filter((e) => {
        if (e.type == "file") return e;
      }).length
    );
    console.log(
      "Tot Folders: ",
      items.filter((e) => {
        if (e.type == "folder") return e;
      }).length
    );

    console.log(items);
  };

  return (
    <>
      <Center height="100vh">
        <FileUploader
          maxSize={10 * 1000000}
          fileType={"other"}
          primaryColor={"red.400"}
          secondaryColor={"gray.100"}
          backgroundColor={"white"}
          showOver={true}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
      </Center>

      <Text position="absolute" bottom="2rem" right="2rem">
        Made by{" "}
        <Link
          color="red.300"
          href="https://github.com/michaelcasadev"
          target="_blank"
        >
          @MichaelCasaDev
        </Link>
      </Text>
    </>
  );
}
