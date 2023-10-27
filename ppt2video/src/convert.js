const reuseKeys = ['section','license','createdAt','updatedAt'];

export const bookProperties = {
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
    for (const key of reuseKeys) {
      if (typeof slide[key] === 'undefined' && typeof prev[key] !== 'undefined') {
        slide[key] = prev[key];
      }
    }
    slide.language = book.language;
    prev = slide;
  }
}

function getLanguage(slides) {
  for (const slide of slides) {
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
    if (topic.slides[0].duration) {
      const sum = topic.slides.reduce((acc,slide) => acc + slide.duration,0);
      ret.timeRequired = sum > 1 ? Math.floor(sum) : 1;
    } else {
      topic.importJson = ret;
    }
    return ret;
  });
}

function getBookKeywords(slides) {
  let ret = [];
  for (const slide of slides) {
    if (slide.bookkeywords) {
      ret.push(slide.bookkeywords);
    }
  }
  return ret.flat();
}

export function convert(pptx, slides, sections) {
  const book = {};
  const language = getLanguage(slides);

  // book properties
  Object.keys(bookProperties).forEach(key => {
    book[key] = pptx.getProperty(key);
  });
  if (language !== null){
    book.language = language;
  }

  book.keywords = getBookKeywords(slides);

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
