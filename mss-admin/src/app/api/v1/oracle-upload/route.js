import common from "oci-common";
import objectstorage from "oci-objectstorage";

export async function POST(req) {
  try {
    const { fileBase64, mimeType, originalName } = await req.json();
    
    if (!fileBase64) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    const configurationDetails = {
      tenancy: process.env.OCI_TENANCY,
      user: process.env.OCI_USER,
      fingerprint: process.env.OCI_FINGERPRINT,
      privateKeyFilePath: require('path').resolve(process.cwd(), process.env.OCI_PRIVATE_KEY_PATH),
      region: common.Region.fromRegionId(process.env.OCI_REGION || "ap-mumbai-1"),
    };

    const fs = require('fs');
    const privateKeyContent = fs.readFileSync(configurationDetails.privateKeyFilePath, 'utf8');

    const provider = new common.SimpleAuthenticationDetailsProvider(
      configurationDetails.tenancy,
      configurationDetails.user,
      configurationDetails.fingerprint,
      privateKeyContent,
      null, // passphrase
      configurationDetails.region
    );

    const client = new objectstorage.ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });

    const ext = originalName ? originalName.split('.').pop() : 'jpg';
    const fileName = `uploads/test-${Date.now()}.${ext}`;

    // Clean base64 string
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");

    const putObjectRequest = {
      namespaceName: process.env.OCI_NAMESPACE,
      bucketName: process.env.OCI_BUCKET,
      objectName: fileName,
      putObjectBody: Buffer.from(base64Data, "base64"),
      contentType: mimeType || "image/jpeg",
    };

    await client.putObject(putObjectRequest);
    
    const url = `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${process.env.OCI_NAMESPACE}/b/${process.env.OCI_BUCKET}/o/${fileName}`;

    return new Response(JSON.stringify({ url, message: "Upload success!" }), { status: 200 });
  } catch (err) {
    console.error("OCI Upload Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Upload failed" }), { status: 500 });
  }
}
