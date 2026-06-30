import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class MediaService {
  constructor(repository, storageClient) {
    this.repository = repository;
    this.storageClient = storageClient;
  }

  /**
   * Interacts with Cloudflare R2 to extract asset keys and produce temporary signed URLs
   */
  async getSecureMediaLink(mediaId) {
    if (!this.storageClient) throw new Error("STORAGE_CONFIGURATION_ERROR");

    const { data: media, error } = await this.repository.getMediaById(mediaId);

    if (error || !media) throw new Error("MEDIA_NOT_FOUND");

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: media.r2_object_key,
    });

    // Formulate a secure, short-lived 60-second viewing window
    const signedUrl = await getSignedUrl(this.storageClient, command, { expiresIn: 60 });
    return { url: signedUrl, title: media.title, expires_in: 60 };
  }
}
