package com.pulsepass.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateArtistRequest(
        @NotBlank(message = "Stage name is required")
        @Size(max = 150, message = "Stage name must have at most 150 characters")
        String stageName,

        @Size(max = 100, message = "Country must have at most 100 characters")
        String country,

        @Size(max = 100, message = "Genre must have at most 100 characters")
        String genre
) {}
