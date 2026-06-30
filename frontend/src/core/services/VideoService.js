export class VideoService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Fetches shielded YouTube resource records from the sealed data tables
   */
  async getProtectedVideo(topicId) {
    const { data: video, error } = await this.repository.getVideoByTopicId(topicId);

    if (error || !video) throw new Error("VIDEO_NOT_FOUND");

    return video;
  }
}
