package com.pulsepass.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateVenueRequest(
        @NotBlank(message = "Venue code is required")
        @Size(max = 30, message = "Venue code must have at most 30 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]*$",
                message = "Venue code may only contain letters, numbers, hyphens and underscores")
        String code,

        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name must have at most 150 characters")
        String name,

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City must have at most 100 characters")
        String city,

        @Size(max = 255, message = "Address must have at most 255 characters")
        String address,

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be greater than or equal to 1")
        Integer capacity
) {}
