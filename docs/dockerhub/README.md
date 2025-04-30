# Quick reference

* **Maintained by**:<br>
  [Germain LEFEBVRE](https://github.com/germainlefebvre4)

* **Where to get help**:<br>
  [Github Discussions](https://github.com/germainlefebvre4/cvwonder-studio/discussions)

# Supported tags and respective Dockerfile links

* [`latest`, `v0`, `v0.0`, `v0.0.1`](https://github.com/germainlefebvre4/cvwonder-studio/blob/v0.0.1/Dockerfile)

# Quick reference (cont.)

* **Where to file issues**:<br>
  https://github.com/germainlefebvre4/cvwonder-studio/issues⁠

* Supported architectures: ([more info⁠]())<br>
  amd64, arm64

* **Source of this description**:<br>
  [cvwonder-studio repo's `docs/dockerhub/` directory](https://github.com/germainlefebvre4/cvwonder-studio/tree/main/docs/dockerhub/) ([history](https://github.com/docker-library/docs/commits/master/nginx))

# What is CV Wonder?

CV Wonder is a tool that allows you to create a CV in a few minutes.
It allows you to massively generate CVs, base on a theme, for thousands of people in a few seconds without friction.
The Theme system allows you to use community themes and create your own for your purposes.

Don't waste any more time formatting your CV, let CV Wonder do it for you and just **focus** on the content.

# What is CV Wonder Studio?

CV Wonder Studio is the web application that allows you to create and manage your CVs.
It is a web application that allows you to create and manage your CVs in an interactive way.

It will be easy for you now to create your CV in a few minutes.
The application offers a gallery of themes that you can use to create your CV.

You can also create your own themes and share them with the community.

## Why use CV Wonder Studio?

Here are some reasons why you should use CV Wonder Studio:

* **Easy to use**: It is easy to use and allows you to create your CV in a few minutes.
* **Interactive**: It is an interactive way to generate and bootstrap your CV.
* **Themes**: It offers a gallery of themes.
* **Self-hosted**: It is easy to self-hosted and it in your company or at home.
* **Containerized**: It is all containerized, minimalistic and thought as tighten as possible.
* **Open Source & Community**: It is an open source project and driven by the community.
* **Free**: CV Wonder Studio is free and will always be free to use and to self-host.

## Features

CV Wonder Studio offers some major features:

* **Create your CV** in a few minutes
* **Choose your theme** from the gallery
* **Download your CV** in PDF format
* **Import your own Theme** and share it with the community

# How to use this image

## Start a CV Wonder Studio

You can find a [docker-compose.yml](https://github.com/germainlefebvre4/cvwonder-studio/blob/main/docker-compose.prod.yml) file in the root of the [CV Wonder Studio](https://github.com/germainlefebvre4/cvwonder-studio) repository.

```yaml
---
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    image: germainlefebvre4/cvwonder-studio:latest
    container_name: cvwonder-studio
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://cvwonder:cvwonder@database:5432/cvwonder
      - LOG_LEVEL=info
      - CVWONDER_VERSION=0.3.0
      - CVWONDER_PDF_GENERATION_PORT=9889
      - REACT_APP_APP_ENV=production

  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cvwonder
      POSTGRES_PASSWORD: cvwonder
      POSTGRES_DB: cvwonder
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

Run the compose and enjoy the CV Wonder Studio.

```bash
cd examples/
docker compose up -d
```

You can now access the CV Wonder Studio at [http://localhost:3000](http://localhost:3000).

# License

View [license information⁠](https://github.com/germainlefebvre4/cvwonder-studio/blob/main/LICENSE) for the software contained in this image.

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.
