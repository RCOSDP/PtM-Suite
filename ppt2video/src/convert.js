const reuseKeys = ['section','license','createdAt','updatedAt'];

const bookProperties = {
  name: "dc:title",
  description: "dc:description",
  publishedAt: "dcterms:created",
  createdAt: "dcterms:created",
  updatedAt: "dcterms:modified",
};

const topicProperties = ['language','createdAt','updatedAt','license','keywords'];

function adjustMetaKey(slides, book) {
  let prev = {
    createdAt: book.createdAt,
    updatedAt: book.updatedAt
  };
  for (const slide of slides) {
    for (key of reuseKeys) {
      if (typeof slide[key] === 'undefined' && typeof prev[key] !== 'undefined') {
        slide[key] = prev[key];
      }
    }
    slide.language = book.language;
    prev = slide;
  }
}

function getProperty(tika, name) {
  const prop = tika.html.head.meta.find(e => e.name === bookProperties[name]);
  return typeof prop !== 'undefined'?prop.content:'';
}

function getPropertyAll(tika, name) {
  return tika.html.head.meta.filter(e => e.name === name).map(e => e.content);
}

function getLanguage(slides) {
  for (slide of slides) {
    if (typeof slide.language !== 'undefined') {
      return slide.language;
    }
  }
  return null;
}

function getDescription(slides) {
  const sa = slides.map(slide => {
    const sa = slide.blocks.filter(b => b.type === 'description');
    if (sa.length > 0) {
      return sa.map(b => b.content).flat(1);
    }
    if (typeof slide.topic !== 'undefined') {
      return slide.content;
    }
    return slide.content.slice(1);
  }).flat(1);

  return sa.join('\n');
}

function addTopicProperty(topic, slide) {
  topicProperties.forEach(key => {
    if (typeof slide[key] !== 'undefined') {
      topic[key] = slide[key];
    }
  });
}

function convertTopics(topics) {
  let num = 1;
  return topics.map(topic => {
    const ret = {
      name: topic.name,
      description: getDescription(topic.slides),
      resource: {
        file: topic.file
      }
    };
    addTopicProperty(ret, topic.slides[0]);
    return ret;
  });
}

function convert(tika, slides, sections) {
  const book = {};
  const language = getLanguage(slides);

  // book properties
  Object.keys(bookProperties).forEach(key => {
    book[key] = getProperty(tika, key);
  });
  if (language !== null){
    book.language = language;
  }
  const keywords = getPropertyAll(tika, 'dc:subject');
  book.keywords = keywords.concat(getPropertyAll(tika, 'cp:keywords'));

  adjustMetaKey(slides, book);

  // sections and topics
  book.sections = sections.map(os => {
    return {
      name: os.name,
      topics: convertTopics(os.topics)
    };
  });

  return book;
}

module.exports = {
  convert
}
